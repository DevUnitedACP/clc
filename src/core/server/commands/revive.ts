import * as alt from 'alt-server';
import { Permissions } from '../../shared/flags/permissions';
import { LOCALE_KEYS } from '../../shared/locale/languages/keys';
import { LocaleManager } from '../../shared/locale/locale';
import { playerFuncs } from '../extensions/Player';
import ChatManager from '../systems/chat';

ChatManager.addCommand(
    'revive',
    LocaleManager.get(LOCALE_KEYS.COMMAND_REVIVE, '/revive'),
    Permissions.Admin,
    handleCommand
);

function handleCommand(player: alt.Player, targetPlayerID: string | null = null): void {
    if (targetPlayerID === null) {
        playerFuncs.set.respawned(player, player.pos);
        return;
    }

    const target: alt.Player = [...alt.Player.all].find((x) => x.id.toString() === targetPlayerID);
    if (!target) {
        playerFuncs.emit.message(player, LocaleManager.get(LOCALE_KEYS.CANNOT_FIND_PLAYER));
        return;
    }

    if (!target.data.isDead) {
        playerFuncs.emit.message(player, LocaleManager.get(LOCALE_KEYS.PLAYER_IS_NOT_DEAD));
        return;
    }

    playerFuncs.set.respawned(target, target.pos);
}