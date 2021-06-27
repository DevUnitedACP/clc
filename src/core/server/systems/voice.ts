/// <reference types="@altv/types-server" />
import * as alt from 'alt-server';
import { DefaultConfig } from '../configs/settings';
import { playerFuncs } from '../extensions/player';
import { getUniquePlayerHash } from '../utility/usefull';
import { SaltyChat, SystemEvent } from '../../shared/utility/enums';
import Logger from '../utility/Logger';

const voiceRanges: Array<number> = [0, 3.0, 8.0, 15.0, 32.0];

class VoiceClient {
    player: alt.Player;
    TeamspeakName: string;
    VoiceRange: number;
    PhoneSpeaker: boolean;
    RadioSpeaker: boolean;

    constructor(player: alt.Player, tsName: string, voiceRange: number) {
        this.player = player;
        this.TeamspeakName = tsName;
        this.VoiceRange = voiceRange;
    }
}

class RadioChannel {
    name: string;
    members: Array<Partial<{ radioChannel: RadioChannel; voiceClient: Partial<VoiceClient>; isSending: boolean }>>;

    constructor(name) {
        this.name = name;
        this.members = new Array<Partial<{ radioChannel: RadioChannel; voiceClient: Partial<VoiceClient>; isSending: boolean }>>();
    }

    isMember(voiceClient: Partial<VoiceClient>): boolean {
        return this.members.findIndex((x) => x.voiceClient === voiceClient) !== -1;
    }

    addMember(voiceClient: Partial<VoiceClient>): void {
        if (this.members.findIndex((x) => x.voiceClient === voiceClient) !== -1) return;
        this.members.push({ radioChannel: this, voiceClient });
        alt.emitClient(voiceClient.player, SaltyChat.SetRadioChannel, this.name);
        this.members.filter((x) => x.isSending).forEach((x) => alt.emitClient(x.voiceClient.player, SaltyChat.IsSending, x.voiceClient.player.id, true, false));
    }

    removeMember(voiceClient: Partial<VoiceClient>): void {
        const index = this.members.findIndex((x) => x.voiceClient === voiceClient);
        if (index === -1) return;
        const member = this.members[index];
        this.members.splice(index, 1);
        if (!member) return;
        if (member.voiceClient.RadioSpeaker) VoiceManager.voiceClients.forEach((x) => alt.emitClient(x.player, SaltyChat.IsSendingRelayed, voiceClient.player.id, false, true, false, '{}'));
        else this.members.forEach((x) => alt.emitClient(x.voiceClient.player, SaltyChat.IsSending, voiceClient.player.id, false, true));
        alt.emitClient(voiceClient.player, SaltyChat.SetRadioChannel, '');
        this.members.filter((x) => x.isSending).forEach((x) => alt.emitClient(x.voiceClient.player, SaltyChat.IsSending, x.voiceClient.player.id, true, false));
    }

    send(voiceClient: Partial<VoiceClient>, isSending: boolean): void {
        const index = this.members.findIndex((x) => x.voiceClient === voiceClient);
        if (index === -1) return;
        const member = this.members[index];
        let stateChanged: boolean = member.isSending !== isSending;
        member.isSending = isSending;
        let members: Array<Partial<{ radioChannel: RadioChannel; voiceClient: Partial<VoiceClient>; isSending: boolean }>> = this.members;
        let onSpeaker: Array<Partial<{ radioChannel: RadioChannel; voiceClient: Partial<VoiceClient>; isSending: boolean }>> = this.members.filter(
            (x) => x.voiceClient.RadioSpeaker && x.voiceClient != voiceClient
        );
        if (onSpeaker.length == 0) {
            members.forEach((x) => alt.emitClient(x.voiceClient.player, SaltyChat.IsSending, voiceClient.player.id, isSending, stateChanged));
            return;
        }
        let memberNames: string[] = onSpeaker.map((x) => x.voiceClient.TeamspeakName);
        VoiceManager.voiceClients.forEach((x) =>
            alt.emitClient(x.player, SaltyChat.IsSendingRelayed, voiceClient.player.id, isSending, stateChanged, this.isMember(x), JSON.stringify(memberNames))
        );
    }
}

export class VoiceManager {
    static identifier: string;
    static pluginVersion: string;
    static soundPack: string;
    static ingameChannel: string;
    static ingameChannelPassword: string;
    static swissChannels: Array<number>;
    static radioTowers: Array<{ x: number; y: number; z: number }>;
    static voiceClients: Array<Partial<VoiceClient>> = [];
    static radioChannels: Array<RadioChannel> = [];

    static initialize() {
        VoiceManager.identifier = DefaultConfig.VOICE_SERVER_ID;
        VoiceManager.pluginVersion = DefaultConfig.VOICE_PLUGIN_VERSION;
        VoiceManager.soundPack = DefaultConfig.VOICE_SOUNDPACK;
        VoiceManager.ingameChannel = DefaultConfig.VOICE_INGAME_CHANNEL;
        VoiceManager.ingameChannelPassword = DefaultConfig.VOICE_INGAME_CHANNEL_PASSWORD;
        VoiceManager.swissChannels = DefaultConfig.VOICE_SWISS_CHANNELS;
        VoiceManager.radioTowers = DefaultConfig.VOICE_RADIO_TOWERS;
        Logger.info('voice api initialized');
    }

    static connect(player: alt.Player) {
        const index = VoiceManager.voiceClients.findIndex((x) => x.player.discord.id === player.discord.id);
        if (index !== -1) VoiceManager.voiceClients.splice(index, 1);
        const voiceClient: VoiceClient = new VoiceClient(player, `TLRP_${getUniquePlayerHash(player, player.discord.id).substring(0, 24)}`, 3);
        VoiceManager.voiceClients.push(voiceClient);
        playerFuncs.emit.meta(player, 'voice', voiceClient.VoiceRange);
        alt.emitClient(player, 'client::updateVoiceRange', voiceClient.VoiceRange);
        alt.emitClient(
            player,
            SaltyChat.Initialize,
            voiceClient.TeamspeakName,
            VoiceManager.identifier,
            VoiceManager.soundPack,
            VoiceManager.ingameChannel,
            VoiceManager.ingameChannelPassword,
            JSON.stringify(VoiceManager.swissChannels),
            JSON.stringify(VoiceManager.radioTowers)
        );
        VoiceManager.voiceClients
            .filter((x) => x.player.discord.id !== player.discord.id)
            .forEach((x) => {
                alt.emitClient(player, SaltyChat.UpdateClient, x.player.id, x.TeamspeakName, x.VoiceRange);
                alt.emitClient(x.player, SaltyChat.UpdateClient, voiceClient.TeamspeakName, voiceClient.player.id, voiceClient.VoiceRange);
            });
        Logger.log(`Salty Chat -> Player ${player.discord.id} connected to Salty Chat`);
    }

    static disconnect(player: alt.Player, reason: string) {
        const index = VoiceManager.voiceClients.findIndex((x) => x.player.discord.id === player.discord.id);
        if (index === -1) return;
        const voiceClient = VoiceManager.voiceClients[index];
        VoiceManager.voiceClients.splice(index, 1);
        VoiceManager.radioChannels.filter((x) => x.isMember(voiceClient)).forEach((x) => x.removeMember(voiceClient));
        VoiceManager.voiceClients.forEach((x) => alt.emitClient(x.player, SaltyChat.Disconnected, x.player.id));
        alt.emitClient(player, SaltyChat.Disconnected, player.id);
        Logger.log(`Salty Chat -> Player ${player.discord.id} disconnected from Salty Chat`);
    }

    static checkVersion(player: alt.Player, version: string) {
        if (!isVersionAccepted(version)) player.kick(`[Salty Chat] Sie benötigen mindestens folgende Version: ${VoiceManager.pluginVersion}`);
    }

    static setVoiceRange(player: alt.Player, voiceRange: number): void {
        const voiceClient = VoiceManager.voiceClients.find((x) => x.player.discord.id === player.discord.id);
        if (!voiceClient) return;
        if (voiceRanges.findIndex((x) => x === voiceRange) !== -1) {
            voiceClient.VoiceRange = voiceRange;
            VoiceManager.voiceClients.forEach((x) => alt.emitClient(x.player, SaltyChat.UpdateClient, player.id, voiceClient.TeamspeakName, voiceClient.VoiceRange));
        }
        playerFuncs.emit.meta(player, 'voice', voiceRange);
        alt.emitClient(player, 'client::updateVoiceRange', voiceRange);
    }

    static joinRadio(player: alt.Player, name: string): void {
        const voiceClient = VoiceManager.voiceClients.find((x) => x.player.discord.id === player.discord.id);
        if (!voiceClient) return;
        let radioChannel = VoiceManager.radioChannels.find((x) => x.isMember(voiceClient));
        if (radioChannel) return;
        radioChannel = getRadioChannel(name, true);
        radioChannel.addMember(voiceClient);
    }

    static leaveRadio(player: alt.Player, name: string): void {
        const voiceClient = VoiceManager.voiceClients.find((x) => x.player.discord.id === player.discord.id);
        if (!voiceClient) return;
        const radioChannel = getRadioChannel(name, false);
        if (!radioChannel) return;
        radioChannel.removeMember(voiceClient);
        if (radioChannel.members.length == 0) {
            const index = VoiceManager.radioChannels.findIndex((x) => x.name === name);
            VoiceManager.radioChannels.splice(index, 1);
        }
    }

    static sendingOnRadio(player: alt.Player, name: string, isSending: boolean): void {
        const voiceClient = VoiceManager.voiceClients.find((x) => x.player.discord.id === player.discord.id);
        if (!voiceClient) return;
        const radioChannel = getRadioChannel(name, false);
        if (!radioChannel || !radioChannel.isMember(voiceClient)) return;
        radioChannel.send(voiceClient, isSending);
    }

    static setRadioSpeaker(player: alt.Player, toggle: boolean) {
        const voiceClient = VoiceManager.voiceClients.find((x) => x.player.discord.id === player.discord.id);
        if (!voiceClient) return;
        voiceClient.RadioSpeaker = toggle;
    }
}

function isVersionAccepted(version: string): boolean {
    if (!version || version === '') return true;
    try {
        let minVersion: string[] = VoiceManager.pluginVersion.split('.');
        let actVersion: string[] = version.split('.');
        let counter: number = 0;
        if (actVersion.length >= minVersion.length) counter = minVersion.length;
        else actVersion.length;
        for (let i = 0; i < counter; i++) {
            let min: number = parseInt(minVersion[i]);
            let cur: number = parseInt(actVersion[i]);
            return cur > min;
        }
    } catch (err) {
        return false;
    }
    return true;
}

function getRadioChannel(name: string, create: boolean): RadioChannel {
    let radioChannel: RadioChannel = VoiceManager.radioChannels.find((x) => x.name === name);
    if (!radioChannel) {
        radioChannel = new RadioChannel(name);
        VoiceManager.radioChannels.push(radioChannel);
    }
    return radioChannel;
}

alt.on('playerDisconnect', VoiceManager.disconnect);
alt.on(SystemEvent.Voice_Add, VoiceManager.connect);
alt.on(SystemEvent.Voice_Remove, VoiceManager.disconnect);
alt.onClient(SaltyChat.CheckVersion, VoiceManager.checkVersion);
alt.onClient(SaltyChat.SetVoiceRange, VoiceManager.setVoiceRange);
alt.onClient(SaltyChat.IsSending, VoiceManager.sendingOnRadio);
alt.onClient('voice:RadioJoin', VoiceManager.joinRadio);
alt.onClient('voice:RadioLeave', VoiceManager.leaveRadio);

export default function loader() {
    VoiceManager.initialize();
}
