import { FlatpickrFn } from '../types/instance';

/* Kazakh locals for flatpickr */
import { CustomLocale } from '../types/locale';

const fp =
    typeof window !== 'undefined' && (window as any).flatpickr !== undefined
        ? (window as any).flatpickr
        : ({
              l10ns: {},
          } as FlatpickrFn);

export const Kazakh: CustomLocale = {
    weekdays: {
        shorthand: ['Жс', 'Дс', 'Сc', 'Ср', 'Бс', 'Жм', 'Сб'],
        longhand: ['Жексенбi', 'Дүйсенбi', 'Сейсенбi', 'Сәрсенбi', 'Бейсенбi', 'Жұма', 'Сенбi'],
    },
    months: {
        shorthand: [
            'Қаң',
            'Ақп',
            'Нау',
            'Сәу',
            'Мам',
            'Мау',
            'Шiл',
            'Там',
            'Қыр',
            'Қаз',
            'Қар',
            'Жел',
        ],
        longhand: [
            'Қаңтар',
            'Ақпан',
            'Наурыз',
            'Сәуiр',
            'Мамыр',
            'Маусым',
            'Шiлде',
            'Тамыз',
            'Қыркүйек',
            'Қазан',
            'Қараша',
            'Желтоқсан',
        ],
    },
    firstDayOfWeek: 1,
    ordinal: function () {
        return '';
    },
    rangeSeparator: ' — ',
    weekAbbreviation: 'Апта',
    scrollTitle: 'Үлкейту үшін айналдырыңыз',
    toggleTitle: 'Ауыстыру үшін басыңыз',
    amPM: ['ТД', 'ТК'],
    yearAriaLabel: 'Жыл',
};

fp.l10ns.kz = Kazakh;

export default fp.l10ns;
