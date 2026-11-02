import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const STATE_FILE_PATH = '/tmp/tokenwatcher_state.json';

function getModelAlias(rawName) {
    if (!rawName) return 'Standby';
    const lower = rawName.toLowerCase();
    if (lower.includes('gemini-3.7') || lower.includes('gemini 3.7')) return 'Gemini 3.7 Flash';
    if (lower.includes('gemini-3.6') || lower.includes('gemini 3.6')) return 'Gemini 3.6 Flash';
    if (lower.includes('gemini-2.5') || lower.includes('gemini 2.5')) return 'Gemini 2.5 Flash';
    if (lower.includes('qwen3-coder-30b') || lower.includes('qwen3-coder')) return 'Qwen3-Coder-30B';
    if (lower.includes('gemma-4-12b') || lower.includes('gemma 4 12b')) return 'Gemma-4-12B';
    if (lower.includes('gemma-4-31b') || lower.includes('gemma 4 31b')) return 'Gemma-4-31B';
    if (lower.includes('claude-3-7-sonnet')) return 'Claude 3.7 Sonnet';
    if (lower.includes('claude-3-5-sonnet')) return 'Claude 3.5 Sonnet';
    if (lower.includes('gpt-4o')) return 'GPT-4o';

    let clean = rawName.replace(/-GGUF$/i, '')
                       .replace(/-Instruct$/i, '')
                       .replace(/-it$/i, '')
                       .replace(/:latest$/i, '')
                       .replace(/-A3B/i, '');
    return clean;
}

function formatTokensM(count) {
    if (!count || isNaN(count) || count <= 0) return '0,00M';
    const val = count / 1000000.0;
    return val.toFixed(2).replace('.', ',') + 'M';
}

function getSourceDisplayName(src) {
    if (!src || src.trim() === '' || src === 'none' || src === 'n/a') return '--n/a--';
    const s = src.toLowerCase();
    if (s === 'hermes') return 'Hermes';
    if (s === 'opencode') return 'OpenCode';
    if (s === 'openwebui') return 'OpenWebUI';
    if (s === 'lemonade') return 'Lemonade';
    return src;
}

const TokenWatcherIndicator = GObject.registerClass(
class TokenWatcherIndicator extends PanelMenu.Button {
    constructor() {
        super(0.0, 'TokenWatcherIndicator', false);

        // Container box in top panel
        this.box = new St.BoxLayout({
            style_class: 'tokenwatcher-box',
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        // Symbolic Icon (terminal for Hermes/OpenCode, chat for OpenWebUI)
        this.icon = new St.Icon({
            icon_name: 'utilities-terminal-symbolic',
            style_class: 'system-status-icon'
        });
        this.box.add_child(this.icon);

        // Label: [LLM Alias] | [#,##M] | [VRAM #,# Go] | [XX°C] | [Source]
        this.label = new St.Label({
            text: 'TokenWatcher',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'tokenwatcher-label'
        });
        this.box.add_child(this.label);

        this.add_child(this.box);

        this._cancellable = new Gio.Cancellable();
        this._signalIds = [];
        this._buildMenu();
    }

    _buildMenu() {
        this.menu.removeAll();

        // Title Header
        this.headerItem = new PopupMenu.PopupMenuItem('TokenWatcher — AI Monitor', { reactive: false });
        this.headerItem.label.add_style_class_name('tokenwatcher-popover-header');
        this.menu.addMenuItem(this.headerItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Status Details in Popover
        this.sourceItem = new PopupMenu.PopupMenuItem('Source: Hermes', { reactive: false });
        this.sourceItem.label.add_style_class_name('tokenwatcher-popover-item');
        this.menu.addMenuItem(this.sourceItem);

        this.projectItem = new PopupMenu.PopupMenuItem('Contexte: Idle', { reactive: false });
        this.projectItem.label.add_style_class_name('tokenwatcher-popover-item');
        this.menu.addMenuItem(this.projectItem);

        this.modelItem = new PopupMenu.PopupMenuItem('Modèle: Standby', { reactive: false });
        this.modelItem.label.add_style_class_name('tokenwatcher-popover-item');
        this.menu.addMenuItem(this.modelItem);

        this.tokensItem = new PopupMenu.PopupMenuItem('Tokens: 0,00M', { reactive: false });
        this.tokensItem.label.add_style_class_name('tokenwatcher-popover-item');
        this.menu.addMenuItem(this.tokensItem);

        this.speedItem = new PopupMenu.PopupMenuItem('Vitesse: Inactif', { reactive: false });
        this.speedItem.label.add_style_class_name('tokenwatcher-popover-item');
        this.menu.addMenuItem(this.speedItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // GPU / Hardware Telemetry Section (Lot 1.3)
        this.gpuHeaderItem = new PopupMenu.PopupMenuItem('GPU / Hardware Telemetry', { reactive: false });
        this.gpuHeaderItem.label.add_style_class_name('tokenwatcher-popover-header');
        this.menu.addMenuItem(this.gpuHeaderItem);

        // Line 1: VRAM Used / Total (existing format preserved)
        this.gpuItem = new PopupMenu.PopupMenuItem('GPU: 0% Load | VRAM: 0,0 Go / 16,0 Go', { reactive: false });
        this.gpuItem.label.add_style_class_name('tokenwatcher-popover-item');
        this.menu.addMenuItem(this.gpuItem);

        // Line 2: GPU Temp (Edge): <XX> °C | SoC (Tctl): <YY> °C
        this.gpuTempItem = new PopupMenu.PopupMenuItem('', { reactive: false });
        this.gpuTempItem.label.add_style_class_name('tokenwatcher-popover-item');
        this.gpuTempItem.visible = false;
        this.menu.addMenuItem(this.gpuTempItem);

        // Line 3: GPU Power: <X> W | Clock: <XXX> MHz
        this.gpuPowerClockItem = new PopupMenu.PopupMenuItem('', { reactive: false });
        this.gpuPowerClockItem.label.add_style_class_name('tokenwatcher-popover-item');
        this.gpuPowerClockItem.visible = false;
        this.menu.addMenuItem(this.gpuPowerClockItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const openWebuiItem = new PopupMenu.PopupMenuItem('Ouvrir Open WebUI (8080)');
        const id1 = openWebuiItem.connect('activate', () => {
            Gio.AppInfo.launch_default_for_uri('http://127.0.0.1:8080', null);
        });
        this._signalIds.push({ actor: openWebuiItem, id: id1 });
        this.menu.addMenuItem(openWebuiItem);

        const openLemonadeItem = new PopupMenu.PopupMenuItem('Ouvrir Lemonade Server (13305)');
        const id2 = openLemonadeItem.connect('activate', () => {
            Gio.AppInfo.launch_default_for_uri('http://127.0.0.1:13305', null);
        });
        this._signalIds.push({ actor: openLemonadeItem, id: id2 });
        this.menu.addMenuItem(openLemonadeItem);
    }

    updateState() {
        const file = Gio.File.new_for_path(STATE_FILE_PATH);
        file.load_contents_async(this._cancellable, (fileObj, res) => {
            try {
                const [success, contents] = fileObj.load_contents_finish(res);
                if (!success || !contents) {
                    this.icon.icon_name = 'utilities-terminal-symbolic';
                    this.label.set_text('Standby');
                    return;
                }

                const decoder = new TextDecoder('utf-8');
                const state = JSON.parse(decoder.decode(contents));
                this._applyState(state);
            } catch (e) {
                if (e.matches && e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                    return;
                }
                if (e.matches && e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
                    this.icon.icon_name = 'utilities-terminal-symbolic';
                    this.label.set_text('Standby');
                    return;
                }
                console.error(`[TokenWatcher] Extension update error: ${e}`);
            }
        });
    }

    _applyState(state) {
        const source = state.source || '';
        const chat = state.chat || {};
        const gpu = state.gpu || {};
        const rawModel = chat.model || state.lemonade_loaded_model || 'Standby';
        const modelAlias = getModelAlias(rawModel);
        const sourceDisplay = getSourceDisplayName(source);

        if (source.toLowerCase() === 'openwebui') {
            this.icon.icon_name = 'chat-message-new-symbolic';
        } else {
            this.icon.icon_name = 'utilities-terminal-symbolic';
        }

        const tps = chat.tokens_per_sec || 0.0;
        const totalTokens = chat.total_tokens || 0;
        const formattedTotalTokensM = formatTokensM(totalTokens);
        const vramGb = (typeof gpu.vram_used_gb === 'number') ? gpu.vram_used_gb : 0.0;
        const vramFormatted = vramGb.toFixed(1).replace('.', ',');
        const gpuBusy = gpu.gpu_busy_percent || 0;

        const rawGpuTemp = (state.gpu_temp_c !== undefined) ? state.gpu_temp_c : gpu.gpu_temp_c;
        const gpuTempC = (typeof rawGpuTemp === 'number' && Number.isFinite(rawGpuTemp) && rawGpuTemp >= 5 && rawGpuTemp <= 125)
            ? Math.round(rawGpuTemp)
            : null;

        const rawCpuTemp = (state.cpu_temp_tctl_c !== undefined) ? state.cpu_temp_tctl_c : gpu.cpu_temp_tctl_c;
        const cpuTempC = (typeof rawCpuTemp === 'number' && Number.isFinite(rawCpuTemp) && rawCpuTemp >= 5 && rawCpuTemp <= 125)
            ? Math.round(rawCpuTemp)
            : null;

        const rawPowerW = (state.gpu_power_w !== undefined) ? state.gpu_power_w : gpu.gpu_power_w;
        const gpuPowerW = (typeof rawPowerW === 'number' && Number.isFinite(rawPowerW) && rawPowerW >= 0)
            ? Math.round(rawPowerW)
            : null;

        const rawClockMhz = (state.gpu_clock_mhz !== undefined) ? state.gpu_clock_mhz : gpu.gpu_clock_mhz;
        const gpuClockMhz = (typeof rawClockMhz === 'number' && Number.isFinite(rawClockMhz) && rawClockMhz > 0)
            ? Math.round(rawClockMhz)
            : null;

        const tempStatus = state.gpu_temp_status || gpu.gpu_temp_status || null;

        // TopBar Format (Lot 1.2):
        // ... | <#,##M> | VRAM <X,X Go> | <XX°C> | <Source>
        let parts = [];
        parts.push(modelAlias);
        parts.push(formattedTotalTokensM);

        if (tps > 0) {
            parts.push(`${tps.toFixed(1)} t/s`);
        }

        parts.push(`VRAM ${vramFormatted} Go`);

        if (gpuTempC !== null) {
            parts.push(`${gpuTempC}°C`);
        }
        parts.push(sourceDisplay);

        this.label.set_text(parts.join(' | '));

        this.label.remove_style_class_name('tw-temp-normal');
        this.label.remove_style_class_name('tw-temp-warm');
        this.label.remove_style_class_name('tw-temp-critical');

        if (gpuTempC !== null) {
            if (tempStatus === 'normal') {
                this.label.add_style_class_name('tw-temp-normal');
            } else if (tempStatus === 'warm') {
                this.label.add_style_class_name('tw-temp-warm');
            } else if (tempStatus === 'critical') {
                this.label.add_style_class_name('tw-temp-critical');
            }
        }

        // Update Popover Details
        const agentMode = chat.agent_mode ? ` (${chat.agent_mode})` : '';
        this.sourceItem.label.set_text(`Source: ${sourceDisplay}${agentMode}`);

        const contextText = chat.chat_title || chat.directory || 'Session Active';
        this.projectItem.label.set_text(`Contexte: ${contextText}`);

        this.modelItem.label.set_text(`Modèle: ${modelAlias} (${rawModel})`);

        const inTokM = formatTokensM(chat.prompt_tokens || 0);
        const outTokM = formatTokensM(chat.completion_tokens || 0);
        this.tokensItem.label.set_text(`Tokens: ${inTokM} in | ${outTokM} out (${formattedTotalTokensM} tot)`);

        const tpsText = tps > 0 ? `${tps.toFixed(1)} t/s (Génération)` : 'Inactif';
        this.speedItem.label.set_text(`Vitesse: ${tpsText}`);

        // Popover GPU / Hardware Telemetry (Lot 1.3):
        // Line 1: VRAM Used / Total (conserver le format existant)
        const totalVramGb = (typeof gpu.vram_total_gb === 'number') ? gpu.vram_total_gb : 16.0;
        const totalVramFormatted = totalVramGb.toFixed(1).replace('.', ',');
        this.gpuItem.label.set_text(`GPU: ${gpuBusy}% Load | VRAM: ${vramFormatted} Go / ${totalVramFormatted} Go`);

        // Line 2: GPU Temp (Edge): <XX> °C | SoC (CPU/GPU Hottest Tctl): <YY> °C (masquer la sous-partie si null)
        let tempParts = [];
        if (gpuTempC !== null) {
            tempParts.push(`GPU Temp (Edge): ${gpuTempC} °C`);
        }
        if (cpuTempC !== null) {
            tempParts.push(`SoC (CPU/GPU Hottest Tctl): ${cpuTempC} °C`);
        }
        if (tempParts.length > 0) {
            this.gpuTempItem.label.set_text(tempParts.join(' | '));
            this.gpuTempItem.visible = true;
        } else {
            this.gpuTempItem.visible = false;
        }

        // Line 3: GPU Power: <X> W | Clock: <XXX> MHz (si disponibles)
        let powerClockParts = [];
        if (gpuPowerW !== null) {
            powerClockParts.push(`GPU Power: ${gpuPowerW} W`);
        }
        if (gpuClockMhz !== null) {
            powerClockParts.push(`Clock: ${gpuClockMhz} MHz`);
        }
        if (powerClockParts.length > 0) {
            this.gpuPowerClockItem.label.set_text(powerClockParts.join(' | '));
            this.gpuPowerClockItem.visible = true;
        } else {
            this.gpuPowerClockItem.visible = false;
        }
    }

    cleanup() {
        if (this._cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
        if (this._signalIds) {
            for (const item of this._signalIds) {
                if (item.actor && item.id) {
                    item.actor.disconnect(item.id);
                }
            }
            this._signalIds = [];
        }
    }
});

export default class TokenWatcherExtension extends Extension {
    enable() {
        this._indicator = new TokenWatcherIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator, 1, 'right');

        this._indicator.updateState();

        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            if (this._indicator) {
                this._indicator.updateState();
            }
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }

        if (this._indicator) {
            this._indicator.cleanup();
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
