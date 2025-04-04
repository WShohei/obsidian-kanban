import classcat from 'classcat';
import update from 'immutability-helper';
import { moment } from 'obsidian';
import Preact from 'preact/compat';

import { Icon } from '../components/Icon/Icon';
import { c, generateInstanceId } from '../components/helpers';
import { StatusEmoji } from '../components/types';
import { getParentBodyElement } from '../dnd/util/getWindow';
import { t } from '../lang/helpers';

interface ItemProps {
    statusEmoji: StatusEmoji;
    deleteStatus: () => void;
    updateStatus: (newStatus: StatusEmoji) => void;
}

function Item({ statusEmoji, deleteStatus, updateStatus }: ItemProps) {
    return (
        <div className={c('setting-item-wrapper')}>
            <div className={c('setting-item')}>
                <div className={`${c('setting-controls-wrapper')} ${c('status-emoji-input')}`}>
                    <div>
                        <div className={c('status-emoji-config')}>
                            <div>
                                <div className={c('setting-item-label')}>{t('Emoji')}</div>
                                <input
                                    type="text"
                                    value={statusEmoji.emoji}
                                    onChange={(e) => {
                                        updateStatus({
                                            ...statusEmoji,
                                            emoji: (e.target as HTMLInputElement).value,
                                        });
                                    }}
                                    placeholder="例: 🚧"
                                />
                            </div>
                            <div>
                                <div className={c('setting-item-label')}>{t('Name')}</div>
                                <input
                                    type="text"
                                    value={statusEmoji.name}
                                    onChange={(e) => {
                                        updateStatus({
                                            ...statusEmoji,
                                            name: (e.target as HTMLInputElement).value,
                                        });
                                    }}
                                    placeholder={t('Status name')}
                                />
                            </div>
                        </div>
                        <div className={c('setting-item-description')}>
                            <div className={c('checkbox-wrapper')}>
                                <div className={c('checkbox-label')}>
                                    {t('Mark as completion status')}
                                </div>
                                <div
                                    onClick={() =>
                                        updateStatus({
                                            ...statusEmoji,
                                            isCompletion: !statusEmoji.isCompletion,
                                        })
                                    }
                                    className={`checkbox-container ${statusEmoji.isCompletion ? 'is-enabled' : ''}`}
                                />
                            </div>
                            <div className={c('setting-item-description')}>
                                {t(
                                    'If enabled, this status will be considered as a completion status'
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className={c('status-emoji-preview')}>
                            <div className={c('item-metadata')}>
                                <span className={c('status-emoji-sample')}>
                                    {statusEmoji.emoji} {moment().format('YYYY-MM-DD')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={c('setting-button-wrapper')}>
                    <div className="clickable-icon" onClick={deleteStatus} aria-label={t('Delete')}>
                        <Icon name="lucide-trash-2" />
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatusEmojiSettingsProps {
    statusEmojis: StatusEmoji[];
    onChange: (settings: StatusEmoji[]) => void;
    portalContainer: HTMLElement;
}

function StatusEmojiSettings({ statusEmojis, onChange }: StatusEmojiSettingsProps) {
    const [emojis, setEmojis] = Preact.useState(statusEmojis);

    const updateEmojis = (emojis: StatusEmoji[]) => {
        onChange(emojis);
        setEmojis(emojis);
    };

    const newEmoji = () => {
        updateEmojis(
            update(emojis, {
                $push: [
                    {
                        id: generateInstanceId(),
                        emoji: '🚧',
                        name: t('In Progress'),
                        isCompletion: false,
                    },
                ],
            })
        );
    };

    const deleteEmoji = (i: number) => {
        updateEmojis(
            update(emojis, {
                $splice: [[i, 1]],
            })
        );
    };

    const updateStatusEmoji = (i: number) => (newStatusEmoji: StatusEmoji) => {
        const updatedEmojis = [...emojis];
        updatedEmojis[i] = newStatusEmoji;
        updateEmojis(updatedEmojis);
    };

    return (
        <div className={c('settings-wrapper')}>
            <h3>{t('Status Emojis')}</h3>
            <p>{t('Define custom status emojis that can be applied to cards in specific lanes')}</p>
            {emojis.map((emoji, i) => (
                <Item
                    key={emoji.id || i}
                    statusEmoji={emoji}
                    deleteStatus={() => deleteEmoji(i)}
                    updateStatus={updateStatusEmoji(i)}
                />
            ))}
            <button className={`mod-cta ${c('add-status-emoji')}`} onClick={newEmoji}>
                {t('Add Status Emoji')}
            </button>
        </div>
    );
}

export function renderStatusEmojiSettings(
    containerEl: HTMLElement,
    statusEmojis: StatusEmoji[],
    onChange: (emojis: StatusEmoji[]) => void
) {
    const wrapper = containerEl.createDiv(c('status-emoji-settings-container'));
    const portal = getParentBodyElement(containerEl);

    Preact.render(
        <StatusEmojiSettings
            statusEmojis={statusEmojis || []}
            onChange={onChange}
            portalContainer={portal}
        />,
        wrapper
    );

    return () => {
        Preact.render(null, wrapper);
        wrapper.remove();
    };
}

export function cleanUpStatusEmojiSettings(containerEl: HTMLElement) {
    const wrappers = containerEl.querySelectorAll(`.${c('status-emoji-settings-container')}`);
    wrappers.forEach((wrapper) => {
        Preact.render(null, wrapper as HTMLElement);
        wrapper.remove();
    });
}
