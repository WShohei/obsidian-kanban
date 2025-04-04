import update from 'immutability-helper';
import { App, MarkdownView, TFile, moment } from 'obsidian';
import Preact, { Dispatch, RefObject, useEffect } from 'preact/compat';
import { StateUpdater, useMemo } from 'preact/hooks';
import { StateManager } from 'src/StateManager';
import { Path } from 'src/dnd/types';
import { getEntityFromPath } from 'src/dnd/util/data';
import {
    InlineField,
    getTaskStatusDone,
    getTaskStatusPreDone,
    toggleTask,
} from 'src/parsers/helpers/inlineMetadata';

import { SearchContextProps } from './context';
import { Board, DataKey, DateColor, Item, Lane, PageData, TagColor } from './types';

export const baseClassName = 'kanban-plugin';

export function noop() {}

const classCache = new Map<string, string>();
export function c(className: string) {
    if (classCache.has(className)) return classCache.get(className);
    const cls = `${baseClassName}__${className}`;
    classCache.set(className, cls);
    return cls;
}

export function generateInstanceId(len: number = 9): string {
    return Math.random()
        .toString(36)
        .slice(2, 2 + len);
}

export function maybeCompleteForMove(
    sourceStateManager: StateManager,
    sourceBoard: Board,
    sourcePath: Path,
    destinationStateManager: StateManager,
    destinationBoard: Board,
    destinationPath: Path,
    item: Item
): { next: Item; replacement?: Item } {
    const sourceParent = getEntityFromPath(sourceBoard, sourcePath.slice(0, -1));
    const destinationParent = getEntityFromPath(destinationBoard, destinationPath.slice(0, -1));

    const oldShouldComplete = sourceParent?.data?.shouldMarkItemsComplete;
    const newShouldComplete = destinationParent?.data?.shouldMarkItemsComplete;

    // Get status emoji information
    const oldStatusId = sourceParent?.data?.shouldApplyStatus;
    const newStatusId = destinationParent?.data?.shouldApplyStatus;

    // Get status emoji
    const statusEmojis = destinationStateManager.getSetting('status-emojis') || [];
    const oldStatusEmoji = oldStatusId ? statusEmojis.find((s) => s.id === oldStatusId) : null;
    const newStatusEmoji = newStatusId ? statusEmojis.find((s) => s.id === newStatusId) : null;

    let currentItem = item; // Working item to apply changes
    let titleRaw = currentItem.data.titleRaw; // Working title
    const now = moment().format('YYYY-MM-DD');
    const datePattern = '\\d{4}-\\d{2}-\\d{2}';
    const emojiDatePattern = new RegExp(`(\\s+\\S+\\s+${datePattern})`); // Emoji + date pattern
    const isCurrentlyComplete =
        currentItem.data.checked && currentItem.data.checkChar === getTaskStatusDone();

    // --- Lane completion state determination ---
    const isOriginCompletionLane =
        oldShouldComplete || (oldStatusEmoji && oldStatusEmoji.isCompletion);
    const isDestCompletionLane =
        newShouldComplete || (newStatusEmoji && newStatusEmoji.isCompletion);

    // --- 1. Checkbox state change ---
    let tasksHandledUpdate = false;
    let replacementFromTasks: Item | undefined = undefined;

    // Moving from Complete -> Non-complete
    if (isOriginCompletionLane && !isDestCompletionLane && isCurrentlyComplete) {
        console.log('Leaving completion lane: Unchecking box');
        const tempItem = update(currentItem, {
            data: { checkChar: { $set: getTaskStatusDone() } },
        });
        const updates = toggleTask(tempItem, destinationStateManager.file);
        if (updates) {
            const [itemStrings, checkChars, thisIndex] = updates;
            itemStrings.forEach((str, i) => {
                if (i === thisIndex) {
                    currentItem = destinationStateManager.getNewItem(str, checkChars[i]);
                } else {
                    replacementFromTasks = destinationStateManager.getNewItem(str, checkChars[i]);
                }
            });
            tasksHandledUpdate = true;
            titleRaw = currentItem.data.titleRaw; // Get title after toggleTask
        } else {
            // Manual uncheck
            currentItem = update(currentItem, {
                data: { checked: { $set: false }, checkChar: { $set: ' ' } },
            });
            titleRaw = currentItem.data.titleRaw;
        }
    }
    // Moving from Non-complete -> Complete
    else if (!isOriginCompletionLane && isDestCompletionLane && !isCurrentlyComplete) {
        console.log('Entering completion lane: Checking box');
        const tempItem = update(currentItem, {
            data: { checkChar: { $set: getTaskStatusPreDone() } },
        });
        const updates = toggleTask(tempItem, destinationStateManager.file);
        if (updates) {
            const [itemStrings, checkChars, thisIndex] = updates;
            itemStrings.forEach((str, i) => {
                if (i === thisIndex) {
                    currentItem = destinationStateManager.getNewItem(str, checkChars[i]);
                } else {
                    replacementFromTasks = destinationStateManager.getNewItem(str, checkChars[i]);
                }
            });
            tasksHandledUpdate = true;
            titleRaw = currentItem.data.titleRaw; // Get title after toggleTask
        } else {
            // Manual check
            currentItem = update(currentItem, {
                data: { checked: { $set: true }, checkChar: { $set: getTaskStatusDone() } },
            });
            titleRaw = currentItem.data.titleRaw;
        }
    }

    // --- 2. Emoji + Date processing in title ---
    let finalTitle = titleRaw; // titleRaw might have been updated by checkbox processing

    // Regex to find all emoji + date patterns (global flag)
    const emojiDatePatternGlobal = new RegExp(`( [^ ]+ ${datePattern})`, 'g');

    // Get a list of all status emojis
    const allEmojis = statusEmojis.map((e) => e.emoji);

    // Case 1: Emoji Lane -> No Emoji Lane (and non-completion lane)
    // Or Completion Lane (Custom Emoji) -> No Emoji Lane (and non-completion lane)
    // Or a card with multiple emojis moves to a "no emoji" lane
    if (
        (oldStatusEmoji && !newStatusEmoji && !isDestCompletionLane) ||
        (isOriginCompletionLane &&
            oldStatusEmoji &&
            oldStatusEmoji.isCompletion &&
            !newStatusEmoji &&
            !isDestCompletionLane) ||
        (!newStatusEmoji && !isDestCompletionLane) // Moving to a no-emoji lane
    ) {
        console.log('Cleaning emoji patterns when moving to non-emoji lane');

        // Remove all emoji + date patterns
        finalTitle = finalTitle.replace(emojiDatePatternGlobal, '');

        // Additionally, remove any remaining emojis in the content
        allEmojis.forEach((emoji) => {
            if (finalTitle.includes(emoji)) {
                // Remove emoji (considering surrounding spaces)
                finalTitle = finalTitle.replace(
                    new RegExp(`\\s*${escapeRegExpStr(emoji)}\\s*`, 'g'),
                    ' '
                );
            }
        });

        // Consolidate multiple spaces into a single space
        finalTitle = finalTitle.replace(/\s+/g, ' ').trim();
    }
    // Case 2: Any Lane -> Emoji Lane (non-completion type)
    else if (newStatusEmoji && !newStatusEmoji.isCompletion) {
        console.log('-> Non-Completion Emoji Lane: Checking if emoji needs appending');

        // Check if the entire title contains the destination emoji
        if (!finalTitle.includes(newStatusEmoji.emoji)) {
            console.log('   Appending emoji:', newStatusEmoji.emoji);
            // Even in Emoji -> Emoji case, append without removing existing ones
            finalTitle = `${finalTitle} ${newStatusEmoji.emoji} ${now}`;
        } else {
            console.log('   Emoji already exists in title, not appending.');
        }
    }
    // Case 3: Emoji Lane -> Completion Lane (Standard or Custom)
    // Do not change the title. Only handle checkbox processing.
    else if (oldStatusEmoji && isDestCompletionLane) {
        console.log('Emoji -> Completion: Keeping existing emoji, handling checkbox only.');
        // No title change needed here based on emojis
    }
    // Other cases (No Emoji -> No Emoji, No Emoji -> Completion, Completion -> Completion) do not require
    // title changes related to emojis.

    // --- 3. Final item update ---
    // If the title was changed or the checkbox was manually changed
    if (
        finalTitle !== currentItem.data.titleRaw ||
        (item.data.checked !== currentItem.data.checked && !tasksHandledUpdate) ||
        (item.data.checkChar !== currentItem.data.checkChar && !tasksHandledUpdate)
    ) {
        currentItem = update(currentItem, {
            data: {
                title: { $set: finalTitle },
                titleRaw: { $set: finalTitle },
                // Reflect manually changed checkbox state
                ...(item.data.checked !== currentItem.data.checked &&
                    !tasksHandledUpdate && { checked: { $set: currentItem.data.checked } }),
                ...(item.data.checkChar !== currentItem.data.checkChar &&
                    !tasksHandledUpdate && { checkChar: { $set: currentItem.data.checkChar } }),
            },
        });
    }

    // Return considering replacement as well
    // Currently assumes that if Tasks returns a replacement, the changes are merged into currentItem
    return { next: currentItem, replacement: replacementFromTasks };
}

export function useIMEInputProps() {
    const isComposingRef = Preact.useRef<boolean>(false);

    return {
        // Note: these are lowercased because we use preact
        // See: https://github.com/preactjs/preact/issues/3003
        oncompositionstart: () => {
            isComposingRef.current = true;
        },
        oncompositionend: () => {
            isComposingRef.current = false;
        },
        getShouldIMEBlockAction: () => {
            return isComposingRef.current;
        },
    };
}

export const templaterDetectRegex = /<%/;

export async function applyTemplate(stateManager: StateManager, templatePath?: string) {
    const templateFile = templatePath
        ? stateManager.app.vault.getAbstractFileByPath(templatePath)
        : null;

    if (templateFile && templateFile instanceof TFile) {
        const activeView = stateManager.app.workspace.getActiveViewOfType(MarkdownView);

        try {
            // Force the view to source mode, if needed
            if (activeView?.getMode() !== 'source') {
                await activeView.setState(
                    {
                        ...activeView.getState(),
                        mode: 'source',
                    },
                    { history: false }
                );
            }

            const { templatesEnabled, templaterEnabled, templatesPlugin, templaterPlugin } =
                getTemplatePlugins(stateManager.app);

            const templateContent = await stateManager.app.vault.read(templateFile);

            // If both plugins are enabled, attempt to detect templater first
            if (templatesEnabled && templaterEnabled) {
                if (templaterDetectRegex.test(templateContent)) {
                    return await templaterPlugin.append_template_to_active_file(templateFile);
                }

                return await templatesPlugin.instance.insertTemplate(templateFile);
            }

            if (templatesEnabled) {
                return await templatesPlugin.instance.insertTemplate(templateFile);
            }

            if (templaterEnabled) {
                return await templaterPlugin.append_template_to_active_file(templateFile);
            }

            // No template plugins enabled so we can just append the template to the doc
            await stateManager.app.vault.modify(
                stateManager.app.workspace.getActiveFile(),
                templateContent
            );
        } catch (e) {
            console.error(e);
            stateManager.setError(e);
        }
    }
}

export function getDefaultDateFormat(app: App) {
    const internalPlugins = (app as any).internalPlugins.plugins;
    const dailyNotesEnabled = internalPlugins['daily-notes']?.enabled;
    const dailyNotesValue = internalPlugins['daily-notes']?.instance.options.format;
    const nlDatesValue = (app as any).plugins.plugins['nldates-obsidian']?.settings.format;
    const templatesEnabled = internalPlugins.templates?.enabled;
    const templatesValue = internalPlugins.templates?.instance.options.dateFormat;

    return (
        (dailyNotesEnabled && dailyNotesValue) ||
        nlDatesValue ||
        (templatesEnabled && templatesValue) ||
        'YYYY-MM-DD'
    );
}

export function getDefaultTimeFormat(app: App) {
    const internalPlugins = (app as any).internalPlugins.plugins;
    const nlDatesValue = (app as any).plugins.plugins['nldates-obsidian']?.settings.timeFormat;
    const templatesEnabled = internalPlugins.templates?.enabled;
    const templatesValue = internalPlugins.templates?.instance.options.timeFormat;

    return nlDatesValue || (templatesEnabled && templatesValue) || 'HH:mm';
}

const reRegExChar = /[\\^$.*+?()[\]{}|]/g;
const reHasRegExChar = RegExp(reRegExChar.source);

export function escapeRegExpStr(str: string) {
    return str && reHasRegExChar.test(str) ? str.replace(reRegExChar, '\\$&') : str || '';
}

export function getTemplatePlugins(app: App) {
    const templatesPlugin = (app as any).internalPlugins.plugins.templates;
    const templatesEnabled = templatesPlugin.enabled;
    const templaterPlugin = (app as any).plugins.plugins['templater-obsidian'];
    const templaterEnabled = (app as any).plugins.enabledPlugins.has('templater-obsidian');
    const templaterEmptyFileTemplate =
        templaterPlugin &&
        (this.app as any).plugins.plugins['templater-obsidian'].settings?.empty_file_template;

    const templateFolder = templatesEnabled
        ? templatesPlugin.instance.options.folder
        : templaterPlugin
          ? templaterPlugin.settings.template_folder
          : undefined;

    return {
        templatesPlugin,
        templatesEnabled,
        templaterPlugin: templaterPlugin?.templater,
        templaterEnabled,
        templaterEmptyFileTemplate,
        templateFolder,
    };
}

export function getTagColorFn(tagColors: TagColor[]) {
    const tagMap = (tagColors || []).reduce<Record<string, TagColor>>((total, current) => {
        if (!current.tagKey) return total;
        total[current.tagKey] = current;
        return total;
    }, {});

    return (tag: string) => {
        if (tagMap[tag]) return tagMap[tag];
        return null;
    };
}

export function useGetTagColorFn(stateManager: StateManager): (tag: string) => TagColor {
    const tagColors = stateManager.useSetting('tag-colors');
    return useMemo(() => getTagColorFn(tagColors), [tagColors]);
}

export function getDateColorFn(dateColors: DateColor[]) {
    const orders = (dateColors || []).map<
        [moment.Moment | 'today' | 'before' | 'after', DateColor]
    >((c) => {
        if (c.isToday) {
            return ['today', c];
        }

        if (c.isBefore) {
            return ['before', c];
        }

        if (c.isAfter) {
            return ['after', c];
        }

        const modifier = c.direction === 'after' ? 1 : -1;
        const date = moment();

        date.add(c.distance * modifier, c.unit);

        return [date, c];
    });

    const now = moment();
    orders.sort((a, b) => {
        if (a[0] === 'today') {
            return typeof b[0] === 'string' ? -1 : b[0].isSame(now, 'day') ? 1 : -1;
        }
        if (b[0] === 'today') {
            return typeof a[0] === 'string' ? 1 : a[0].isSame(now, 'day') ? -1 : 1;
        }

        if (a[0] === 'after') return 1;
        if (a[0] === 'before') return 1;
        if (b[0] === 'after') return -1;
        if (b[0] === 'before') return -1;

        return a[0].isBefore(b[0]) ? -1 : 1;
    });

    return (date: moment.Moment) => {
        const now = moment();
        const result = orders.find((o) => {
            const key = o[1];
            if (key.isToday) return date.isSame(now, 'day');
            if (key.isAfter) return date.isAfter(now);
            if (key.isBefore) return date.isBefore(now);

            let granularity: moment.unitOfTime.StartOf = 'days';

            if (key.unit === 'hours') {
                granularity = 'hours';
            }

            if (key.direction === 'before') {
                return date.isBetween(o[0], now, granularity, '[]');
            }

            return date.isBetween(now, o[0], granularity, '[]');
        });

        if (result) {
            return result[1];
        }

        return null;
    };
}

export function useGetDateColorFn(
    stateManager: StateManager
): (date: moment.Moment) => DateColor | null {
    const dateColors = stateManager.useSetting('date-colors');
    return useMemo(() => getDateColorFn(dateColors), [dateColors]);
}

export function parseMetadataWithOptions(data: InlineField, metadataKeys: DataKey[]): PageData {
    const options = metadataKeys.find((opts) => opts.metadataKey === data.key);

    return options
        ? {
              ...options,
              value: data.value,
          }
        : {
              containsMarkdown: false,
              label: data.key,
              metadataKey: data.key,
              shouldHideLabel: false,
              value: data.value,
          };
}

export function useOnMount(refs: RefObject<HTMLElement>[], cb: () => void, onUnmount?: () => void) {
    useEffect(() => {
        let complete = 0;
        let unmounted = false;
        const onDone = () => {
            if (unmounted) return;
            if (++complete === refs.length) {
                cb();
            }
        };
        for (const ref of refs) ref.current?.onNodeInserted(onDone, true);
        return () => {
            unmounted = true;
            onUnmount();
        };
    }, []);
}

export function useSearchValue(
    board: Board,
    query: string,
    setSearchQuery: Dispatch<StateUpdater<string>>,
    setDebouncedSearchQuery: Dispatch<StateUpdater<string>>,
    setIsSearching: Dispatch<StateUpdater<boolean>>
) {
    return useMemo<SearchContextProps>(() => {
        query = query.trim().toLocaleLowerCase();

        const lanes = new Set<Lane>();
        const items = new Set<Item>();

        if (query) {
            board.children.forEach((lane) => {
                let laneMatched = false;
                lane.children.forEach((item) => {
                    if (item.data.titleSearch.includes(query)) {
                        laneMatched = true;
                        items.add(item);
                    }
                });
                if (laneMatched) lanes.add(lane);
            });
        }

        return {
            lanes,
            items,
            query,
            search: (query, immediate) => {
                if (!query) {
                    setIsSearching(false);
                    setSearchQuery('');
                    setDebouncedSearchQuery('');
                }
                setIsSearching(true);
                if (immediate) {
                    setSearchQuery(query);
                    setDebouncedSearchQuery(query);
                } else {
                    setSearchQuery(query);
                }
            },
        };
    }, [board, query, setSearchQuery, setDebouncedSearchQuery]);
}
