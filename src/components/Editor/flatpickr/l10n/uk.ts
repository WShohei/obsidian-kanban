import { FlatpickrFn } from '../types/instance';

/* Ukrainian locals for flatpickr */
import { CustomLocale } from '../types/locale';

const fp =
    typeof window !== 'undefined' && (window as any).flatpickr !== undefined
        ? (window as any).flatpickr
        : ({
              l10ns: {},
          } as FlatpickrFn);

export const Ukrainian: CustomLocale = {
    firstDayOfWeek: 1,

    weekdays: {
        shorthand: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
        longhand: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'],
    },

    months: {
        shorthand: [
            'Січ',
            'Лют',
            'Бер',
            'Кві',
            'Тра',
            'Чер',
            'Лип',
            'Сер',
            'Вер',
            'Жов',
            'Лис',
            'Гру',
        ],
        longhand: [
            'Січень',
            'Лютий',
            'Березень',
            'Квітень',
            'Травень',
            'Червень',
            'Липень',
            'Серпень',
            'Вересень',
            'Жовтень',
            'Листопад',
            'Грудень',
        ],
    },
    time_24hr: true,
};

fp.l10ns.uk = Ukrainian;

export default fp.l10ns;
