import * as alt from 'alt-client';
import { PhoneEvents } from '../../../../../shared/enums/phone-events';
import { SystemEvent } from '../../../../../shared/enums/system';
import { VehicleData } from '../../../../../shared/configs/vehicle-data';
import { BaseHUD } from '../../hud';

export class DealershipAppManager {
    static init() {
        BaseHUD.view.on('phone:Dealership:Populate', DealershipAppManager.populate);
    }

    static populate() {
        BaseHUD.view.emit('phone:Dealership:Vehicles', VehicleData);
    }
}