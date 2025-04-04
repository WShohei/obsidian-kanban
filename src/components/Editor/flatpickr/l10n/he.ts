import { FlatpickrFn } from '../types/instance';

/* Hebrew locals for flatpickr */
import { CustomLocale } from '../types/locale';

const fp =
    typeof window !== 'undefined' && (window as any).flatpickr !== undefined
        ? (window as any).flatpickr
        : ({
              l10ns: {},
          } as FlatpickrFn);

export const Hebrew: CustomLocale = {
    weekdays: {
        shorthand: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
        longhand: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    },

    months: {
        shorthand: [
            'ינו׳',
            'פבר׳',
            'מרץ',
            'אפר׳',
            'מאי',
            'יוני',
            'יולי',
            'אוג׳',
            'ספט׳',
            'אוק׳',
            'נוב׳',
            'דצמ׳',
        ],
        longhand: [
            'ינואר',
            'פברואר',
            'מרץ',
            'אפריל',
            'מאי',
            'יוני',
            'יולי',
            'אוגוסט',
            'ספטמבר',
            'אוקטובר',
            'נובמבר',
            'דצמבר',
        ],
    },
    rangeSeparator: ' אל ',
    time_24hr: true,
};

fp.l10ns.he = Hebrew;

export default fp.l10ns;
