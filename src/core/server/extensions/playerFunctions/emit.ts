import * as alt from 'alt-server';
import { SystemEvent } from '../../../shared/enums/system';
import { View_Events_Chat } from '../../../shared/enums/views';
import { AnimationFlags } from '../../../shared/flags/animation';
import { AudioStream } from '../../../shared/interfaces/audio';
import { Particle } from '../../../shared/interfaces/particle';
import { ProgressBar } from '../../../shared/interfaces/progress-bar';
import { Task, TaskCallback } from '../../../shared/interfaces/task-timeline';
import utility from './utility';

/**
 * Play an animation on this player.
 * @param {string} dictionary
 * @param {string} name
 * @param {AnimationFlags} flags
 * @param {number} [duration=-1]
 * @return {*}  {void}
 * @memberof EmitPrototype
 */
function animation(p: alt.Player, dictionary: string, name: string, flags: AnimationFlags, duration: number = -1): void {
    if (p.data.isUnconscious) {
        alt.logWarning(`[3L:RP] Cannot play ${dictionary}@${name} while player is dead.`);
        return;
    }

    alt.emitClient(p, SystemEvent.PLAYER_EMIT_ANIMATION, dictionary, name, flags, duration);
}

/**
 * Play a YouTube Audio Stream in a Given Radius
 * @param {AudioStream} stream
 */
function audioStream(stream: AudioStream) {
    alt.emitClient(null, SystemEvent.PLAYER_EMIT_AUDIO_STREAM, stream);
}

/**
 * Synchronize a local variable to access locally for this player.
 * @param {string} key
 * @param {*} value
 * @memberof EmitPrototype
 */
function meta(p: alt.Player, key: string, value: any): void {
    alt.nextTick(() => {
        alt.emitClient(p, SystemEvent.META_SET, key, value);
    });
}

/**
 * Send a message to this player's chat box.
 * @param {string} message
 * @memberof EmitPrototype
 */
function message(p: alt.Player, message: string): void {
    alt.emitClient(p, View_Events_Chat.Append, message);
}

/**
 * Send a notification to this player.
 * @param {string} message
 * @memberof EmitPrototype
 */
function notification(p: alt.Player, message: string): void {
    alt.emitClient(p, SystemEvent.PLAYER_EMIT_NOTIFICATION, message);
}

/**
 * Play a particle effect at a specific coordinate.
 * @param {Particle} particle
 * @param {boolean} [emitToNearbyPlayers=false]
 */
function particle(p: alt.Player, particle: Particle, emitToNearbyPlayers = false): void {
    if (!emitToNearbyPlayers) {
        alt.emitClient(p, SystemEvent.PLAY_PARTICLE_EFFECT, particle);
        return;
    }

    const nearbyPlayers = utility.getClosestPlayers(p, 10);
    for (let i = 0; i < nearbyPlayers.length; i++) {
        const player = nearbyPlayers[i];
        player.emit(SystemEvent.PLAY_PARTICLE_EFFECT, particle);
    }
}

/**
 * Create a progress bar that eventually ends itself.
 * @param {alt.Player} player
 * @param {ProgressBar} progressbar
 */
function createProgressBar(player: alt.Player, progressbar: ProgressBar) {
    player.emit(SystemEvent.PROGRESSBAR_CREATE, progressbar);
}

/**
 * Remove a progress bar based on its unique identifier.
 * @param {alt.Player} player
 * @param {string} uid
 */
function removeProgressBar(player: alt.Player, uid: string) {
    player.emit(SystemEvent.PROGRESSBAR_REMOVE, uid);
}

/**
 * Play a sound without any positional data.
 * @param {alt.Player} p
 * @param {string} audioName
 * @param {number} [volume=0.35]
 */
function sound2D(p: alt.Player, audioName: string, volume: number = 0.35) {
    alt.emitClient(p, SystemEvent.PLAYER_EMIT_SOUND_2D, audioName, volume);
}

/**
 * Play a sound from at a target's location for this player.
 * @param {string} audioName
 * @param {alt.Entity} target
 * @memberof EmitPrototype
 */
function sound3D(p: alt.Player, audioName: string, target: alt.Entity): void {
    alt.emitClient(p, SystemEvent.PLAYER_EMIT_SOUND_3D, target, audioName);
}

/**
 * Play a frontend sound for this player.
 * @param {string} audioName
 * @param {string} ref
 * @memberof EmitPrototype
 */
function soundFrontend(p: alt.Player, audioName: string, ref: string): void {
    alt.emitClient(p, SystemEvent.PLAYER_EMIT_FRONTEND_SOUND, audioName, ref);
}

/**
 * Force the player to perform an uncancellable task timeline.
 * @param {Array<Task | TaskCallback>} tasks
 */
function taskTimeline(player: alt.Player, tasks: Array<Task | TaskCallback>) {
    player.emit(SystemEvent.PLAYER_EMIT_TASK_TIMELINE, tasks);
}

export default {
    animation,
    audioStream,
    createProgressBar,
    meta,
    message,
    notification,
    particle,
    removeProgressBar,
    sound2D,
    sound3D,
    soundFrontend,
    taskTimeline
};
