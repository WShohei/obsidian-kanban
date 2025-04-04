import { FlatpickrFn } from '../types/instance';

/* Japanese locals for flatpickr */
import { CustomLocale } from '../types/locale';

const fp =
    typeof window !== 'undefined' && (window as any).flatpickr !== undefined
        ? (window as any).flatpickr
        : ({
              l10ns: {},
          } as FlatpickrFn);

export const Japanese: CustomLocale = {
    weekdays: {
        shorthand: ['日', '月', '火', '水', '木', '金', '土'],
        longhand: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    },

    months: {
        shorthand: [
            '1月',
            '2月',
            '3月',
            '4月',
            '5月',
            '6月',
            '7月',
            '8月',
            '9月',
            '10月',
            '11月',
            '12月',
        ],
        longhand: [
            '1月',
            '2月',
            '3月',
            '4月',
            '5月',
            '6月',
            '7月',
            '8月',
            '9月',
            '10月',
            '11月',
            '12月',
        ],
    },
    time_24hr: true,
    rangeSeparator: ' から ',
    monthAriaLabel: '月',
    amPM: ['午前', '午後'],
    yearAriaLabel: '年',
    hourAriaLabel: '時間',
    minuteAriaLabel: '分',
};

fp.l10ns.ja = Japanese;

export default fp.l10ns;
