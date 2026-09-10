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
    if (!src) return 'Hermes';
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

        // Label: [LLM Alias] | [#,##M] | [VRAM #,# Go] | [Source]
        this.label = new St.Label({
            text: 'TokenWatcher',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'tokenwatcher-label'
        });
        this.box.add_child(this.label);

        this.add_child(this.box);

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

        this.gpuItem = new PopupMenu.PopupMenuItem('GPU: 0% | VRAM: 0,0 Go', { reactive: false });
        this.gpuItem.label.add_style_class_name('tokenwatcher-popover-item');
        this.menu.addMenuItem(this.gpuItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Fast Action Buttons
        const openWebuiItem = new PopupMenu.PopupMenuItem('Ouvrir Open WebUI (8080)');
        openWebuiItem.connect('activate', () => {
            Gio.AppInfo.launch_default_for_uri('http://127.0.0.1:8080', null);
        });
        this.menu.addMenuItem(openWebuiItem);

        const openLemonadeItem = new PopupMenu.PopupMenuItem('Ouvrir Lemonade Server (13305)');
        openLemonadeItem.connect('activate', () => {
            Gio.AppInfo.launch_default_for_uri('http://127.0.0.1:13305', null);
        });
        this.menu.addMenuItem(openLemonadeItem);
    }

    updateState() {
        const file = Gio.File.new_for_path(STATE_FILE_PATH);
        if (!file.query_exists(null)) {
            this.icon.icon_name = 'utilities-terminal-symbolic';
            this.label.set_text('Standby');
            return;
        }

        try {
            const [success, contents] = file.load_contents(null);
            if (!success) return;

            const decoder = new TextDecoder('utf-8');
            const state = JSON.parse(decoder.decode(contents));

            const source = state.source || 'hermes';
            const chat = state.chat || {};
            const gpu = state.gpu || {};
            const rawModel = chat.model || state.lemonade_loaded_model || 'Standby';
            const modelAlias = getModelAlias(rawModel);
            const sourceDisplay = getSourceDisplayName(source);

            // Icon according to source
            if (source === 'openwebui') {
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

            // Clean TopBar Format:
            // [Icon] <Model Alias> | <#,##M> | VRAM <X,X Go> | <Source>
            let parts = [];
            parts.push(modelAlias);
            parts.push(formattedTotalTokensM);
            
            if (tps > 0) {
                parts.push(`${tps.toFixed(1)} t/s`);
            }
            
            parts.push(`VRAM ${vramFormatted} Go`);
            parts.push(sourceDisplay);

            const labelText = parts.join(' | ');
            this.label.set_text(labelText);

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

            const totalVramGb = (typeof gpu.vram_total_gb === 'number') ? gpu.vram_total_gb : 16.0;
            const totalVramFormatted = totalVramGb.toFixed(1).replace('.', ',');
            this.gpuItem.label.set_text(`GPU: ${gpuBusy}% Load | VRAM: ${vramFormatted} Go / ${totalVramFormatted} Go`);

        } catch (e) {
            log(`[TokenWatcher] Extension update error: ${e}`);
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
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
