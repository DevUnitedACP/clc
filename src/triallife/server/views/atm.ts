import * as alt from 'alt-server';
import { EconomyType } from '../../shared/enums/economyTypes';
import { PhoneEvents } from '../../shared/enums/phoneEvent';
import { SystemEvent } from '../../shared/enums/system';
import { LOCALE_KEYS } from '../../shared/locale/languages/keys';
import { LocaleController } from '../../shared/locale/locale';
import { playerFuncs } from '../extensions/Player';

const ActionHandlers = {
    deposit: handleDeposit,
    withdraw: handleWithdraw,
    transfer: handleTransfer,
    transferCash: handleTransferCash
};

alt.onClient(SystemEvent.INTERACTION_ATM_ACTION, handleAction);
alt.onClient(PhoneEvents.ATM_TRANSFER.name, handlePhoneRoute);

function handlePhoneRoute(player: alt.Player, type: string, amount: string | number, id: null | number) {
    if (type === 'bank') {
        type = 'transfer';
    } else {
        type = 'transferCash';
    }

    handleAction(player, type, amount, id);
}

function handleAction(player: alt.Player, type: string, amount: string | number, id: null | number): void {
    if (isNaN(amount as number)) {
        playerFuncs.sync.economyData(player);
        return;
    }

    amount = parseFloat(amount as string);

    if (!amount || amount <= 0) {
        playerFuncs.sync.economyData(player);
        return;
    }

    if (!ActionHandlers[type]) {
        playerFuncs.sync.economyData(player);
        return;
    }

    const result = ActionHandlers[type](player, amount, id);
    playerFuncs.sync.economyData(player);

    if (!result) {
        playerFuncs.emit.soundFrontend(player, 'Hack_Failed', 'DLC_HEIST_BIOLAB_PREP_HACKING_SOUNDS');
    } else {
        playerFuncs.emit.soundFrontend(player, 'Hack_Success', 'DLC_HEIST_BIOLAB_PREP_HACKING_SOUNDS');
    }
}

function handleDeposit(player: alt.Player, amount: number): boolean {
    if (player.data.cash < amount) {
        return false;
    }

    playerFuncs.economy.sub(player, EconomyType.CASH, amount);
    playerFuncs.economy.add(player, EconomyType.BANK, amount);

    return true;
}

function handleWithdraw(player: alt.Player, amount: number): boolean {
    if (player.data.bank < amount) {
        return false;
    }

    playerFuncs.economy.sub(player, EconomyType.BANK, amount);
    playerFuncs.economy.add(player, EconomyType.CASH, amount);

    return true;
}

function handleTransfer(player: alt.Player, amount: number, id: string | number): boolean {
    const target: alt.Player = [...alt.Player.all].find((x) => `${x.id}` === `${id}`);
    if (!target) {
        return false;
    }

    if (target.id === player.id) {
        return false;
    }

    if (amount > player.data.bank) {
        return false;
    }

    playerFuncs.economy.sub(player, EconomyType.BANK, amount);
    playerFuncs.economy.add(target, EconomyType.BANK, amount);
    const msg = LocaleController.get(LOCALE_KEYS.PLAYER_RECEIVED_BLANK, `$${amount}`, player.data.name);
    playerFuncs.emit.notification(target, msg);
    return true;
}

function handleTransferCash(player: alt.Player, amount: number, id: string | number): boolean {
    const target: alt.Player = [...alt.Player.all].find((x) => `${x.id}` === `${id}`);
    if (!target) {
        return false;
    }

    if (target.id === player.id) {
        return false;
    }

    if (amount > player.data.cash) {
        return false;
    }

    playerFuncs.economy.sub(player, EconomyType.CASH, amount);
    playerFuncs.economy.add(target, EconomyType.CASH, amount);

    const msg = LocaleController.get(LOCALE_KEYS.PLAYER_RECEIVED_BLANK, `$${amount}`, player.data.name);
    playerFuncs.emit.notification(target, msg);
    return true;
}