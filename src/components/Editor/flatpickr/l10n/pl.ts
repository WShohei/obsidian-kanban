import { FlatpickrFn } from '../types/instance';

/* Polish locals for flatpickr */
import { CustomLocale } from '../types/locale';

const fp =
    typeof window !== 'undefined' && (window as any).flatpickr !== undefined
        ? (window as any).flatpickr
        : ({
              l10ns: {},
          } as FlatpickrFn);

export const Polish: CustomLocale = {
    weekdays: {
        shorthand: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'],
        longhand: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
    },

    months: {
        shorthand: [
            'Sty',
            'Lut',
            'Mar',
            'Kwi',
            'Maj',
            'Cze',
            'Lip',
            'Sie',
            'Wrz',
            'Paź',
            'Lis',
            'Gru',
        ],
        longhand: [
            'Styczeń',
            'Luty',
            'Marzec',
            'Kwiecień',
            'Maj',
            'Czerwiec',
            'Lipiec',
            'Sierpień',
            'Wrzesień',
            'Październik',
            'Listopad',
            'Grudzień',
        ],
    },
    rangeSeparator: ' do ',
    weekAbbreviation: 'tydz.',
    scrollTitle: 'Przewiń, aby zwiększyć',
    toggleTitle: 'Kliknij, aby przełączyć',
    firstDayOfWeek: 1,
    time_24hr: true,

    ordinal: () => {
        return '.';
    },
};

fp.l10ns.pl = Polish;

export default fp.l10ns;
