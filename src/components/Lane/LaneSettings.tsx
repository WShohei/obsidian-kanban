import update from 'immutability-helper';
import { useContext } from 'preact/compat';
import { Path } from 'src/dnd/types';
import { t } from 'src/lang/helpers';

import { KanbanContext } from '../context';
import { c } from '../helpers';
import { EditState, Lane, StatusEmoji, isEditing } from '../types';

export interface LaneSettingsProps {
    lane: Lane;
    lanePath: Path;
    editState: EditState;
}

export function LaneSettings({ lane, lanePath, editState }: LaneSettingsProps) {
    const { boardModifiers, stateManager } = useContext(KanbanContext);
    const statusEmojis = stateManager.getSetting('status-emojis') || [];

    if (!isEditing(editState)) return null;

    // Get the lane's current status setting
    // Properly distinguish between status:completion and shouldMarkItemsComplete
    let currentStatus = 'none';
    if (lane.data.shouldApplyStatus) {
        currentStatus = lane.data.shouldApplyStatus;
    } else if (lane.data.shouldMarkItemsComplete) {
        currentStatus = 'completion';
    }

    return (
        <div className={c('lane-setting-wrapper')}>
            <div className={c('status-selection-wrapper')}>
                <div className={c('setting-item-label')}>
                    {t('Apply status to cards in this list')}
                </div>
                <select
                    className="dropdown"
                    value={currentStatus}
                    onChange={(e) => {
                        const value = (e.target as HTMLSelectElement).value;

                        // Set or remove the standard completion status
                        const shouldMarkComplete = value === 'completion';

                        // Apply the update
                        boardModifiers.updateLane(
                            lanePath,
                            update(lane, {
                                data: {
                                    shouldMarkItemsComplete: { $set: shouldMarkComplete },
                                    shouldApplyStatus: {
                                        $set:
                                            value === 'none' || value === 'completion'
                                                ? undefined
                                                : value,
                                    },
                                },
                            })
                        );
                    }}
                >
                    <option value="none">{t('None')}</option>
                    <option value="completion">{t('Completion (✅)')}</option>
                    {statusEmojis.map((emoji) => (
                        <option key={emoji.id} value={emoji.id}>
                            {emoji.emoji} {emoji.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
