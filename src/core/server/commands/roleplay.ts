import * as alt from 'alt-server';
import { View_Events_Chat } from '../../shared/enums/views';
import { Permissions } from '../../shared/flags/permissions';
import { LOCALE_KEYS } from '../../shared/locale/languages/keys';
import { LocaleManager } from '../../shared/locale/locale';
import { DefaultConfig } from '../configs/settings';
import { playerFuncs } from '../extensions/Player';
import ChatManager from '../systems/chat';
import { emitAll } from '../utility/emit-helper';
import { getPlayersByGridSpace } from '../utility/filters';
import { distance2d } from '../utility/vector';

// Talk out of Character
ChatManager.addCommand('b', LocaleManager.get(LOCALE_KEYS.COMMAND_OOC, '/b'), Permissions.None, handleCommandOOC);
ChatManager.addCommand('ooc', LocaleManager.get(LOCALE_KEYS.COMMAND_OOC, '/ooc'), Permissions.None, handleCommandOOC);

// Perform an Action
ChatManager.addCommand('me', LocaleManager.get(LOCALE_KEYS.COMMAND_ME, '/me'), Permissions.None, handleCommandMe);

// Describe an Action
ChatManager.addCommand('do', LocaleManager.get(LOCALE_KEYS.COMMAND_DO, '/do'), Permissions.None, handleCommandDo);

// Speak Low
ChatManager.addCommand('low', LocaleManager.get(LOCALE_KEYS.COMMAND_LOW, '/low'), Permissions.None, handleCommandLow);

// Whisper
ChatManager.addCommand(
    'w',
    LocaleManager.get(LOCALE_KEYS.COMMAND_WHISPER, '/w'),
    Permissions.None,
    handleCommandWhisper
);

// alias
ChatManager.addCommand(
    'whisper',
    LocaleManager.get(LOCALE_KEYS.COMMAND_WHISPER, '/whisper'),
    Permissions.None,
    handleCommandWhisper
);

function handleCommandOOC(player: alt.Player, ...args): void {
    if (args.length <= 0) {
        playerFuncs.emit.message(player, ChatManager.getDescription('b'));
        return;
    }

    const fullMessage = args.join(' ');
    const closestPlayers = getPlayersByGridSpace(player, DefaultConfig.COMMAND_OOC_DISTANCE);

    emitAll(
        closestPlayers,
        View_Events_Chat.Append,
        `${DefaultConfig.CHAT_ROLEPLAY_OOC_COLOR}${player.data.name}: (( ${fullMessage} ))`
    );
}

function handleCommandMe(player: alt.Player, ...args): void {
    if (args.length <= 0) {
        playerFuncs.emit.message(player, ChatManager.getDescription('me'));
        return;
    }

    const fullMessage = args.join(' ');
    const closestPlayers = getPlayersByGridSpace(player, DefaultConfig.COMMAND_ME_DISTANCE);

    emitAll(
        closestPlayers,
        View_Events_Chat.Append,
        `${DefaultConfig.CHAT_ROLEPLAY_COLOR}${player.data.name} ${fullMessage}`
    );
}

function handleCommandDo(player: alt.Player, ...args): void {
    if (args.length <= 0) {
        playerFuncs.emit.message(player, ChatManager.getDescription('do'));
        return;
    }

    const fullMessage = args.join(' ');
    const closestPlayers = getPlayersByGridSpace(player, DefaultConfig.COMMAND_DO_DISTANCE);

    emitAll(
        closestPlayers,
        View_Events_Chat.Append,
        `${DefaultConfig.CHAT_ROLEPLAY_COLOR}* ${fullMessage} ((${player.data.name}))`
    );
}

function handleCommandLow(player: alt.Player, ...args): void {
    if (args.length <= 0) {
        playerFuncs.emit.message(player, ChatManager.getDescription('low'));
        return;
    }

    const fullMessage = args.join(' ');
    const closestPlayers = getPlayersByGridSpace(player, DefaultConfig.COMMAND_LOW_DISTANCE);

    emitAll(
        closestPlayers,
        View_Events_Chat.Append,
        `${DefaultConfig.CHAT_ROLEPLAY_LOW_COLOR}${player.data.name} ${fullMessage}`
    );
}

function handleCommandWhisper(player: alt.Player, id: string, ...args) {
    if (args.length <= 0) {
        return;
    }

    if (typeof id !== 'string') {
        playerFuncs.emit.message(player, ChatManager.getDescription('w'));
        return;
    }

    if (id === null) {
        playerFuncs.emit.message(player, ChatManager.getDescription('w'));
        return;
    }

    const players = [...alt.Player.all];
    const target = players.find((target) => target && id === target.id.toString());

    if (!target || !target.valid) {
        playerFuncs.emit.message(player, LocaleManager.get(LOCALE_KEYS.CANNOT_FIND_PLAYER));
        return;
    }

    if (distance2d(target.pos, player.pos) > DefaultConfig.COMMAND_WHISPER_DISTANCE) {
        playerFuncs.emit.message(player, LocaleManager.get(LOCALE_KEYS.PLAYER_IS_TOO_FAR));
        return;
    }

    const fullMessage = args.join(' ');
    playerFuncs.emit.message(
        player,
        `${DefaultConfig.CHAT_ROLEPLAY_WHISPER_COLOR}You whisper: '${fullMessage}' to ${target.data.name}`
    );

    playerFuncs.emit.message(
        target,
        `${DefaultConfig.CHAT_ROLEPLAY_WHISPER_COLOR}${player.data.name} whispers: ${fullMessage}`
    );
}