import { Rating } from '../../components/Rating/Rating';
import { Select, TextArea, TextInput } from '../../components/TextInput/TextInput';
import { todayIso } from '../../domain/dates';
import { CURRENCIES, LIMITS, type FieldErrors, type RatingFormValues } from '../../domain/schemas';
import styles from './Forms.module.css';

export interface RatingFieldsProps {
  values: RatingFormValues;
  errors: FieldErrors<RatingFormValues>;
  onChange: (values: RatingFormValues) => void;
  /** main: stars and note. more: date, place, price. all: everything. */
  show?: 'all' | 'main' | 'more';
}

export const RATING_MORE_FIELDS = ['tastedOn', 'place', 'pricePaid', 'currency'] as const;

/** The fields of one tasting. Only the stars are required. */
export function RatingFields({ values, errors, onChange, show = 'all' }: RatingFieldsProps) {
  const main = show !== 'more';
  const more = show !== 'main';
  const set = (key: keyof RatingFormValues) => (event: { target: { value: string } }) =>
    onChange({ ...values, [key]: event.target.value });
  const currencies = CURRENCIES.includes(values.currency as (typeof CURRENCIES)[number])
    ? CURRENCIES
    : [values.currency, ...CURRENCIES];

  return (
    <div className={styles.grid}>
      {main && (
        <>
          <div className={styles.wide}>
            <span className={styles.caption} aria-hidden="true">
              Your rating
            </span>
            <Rating
              label="Your rating"
              value={values.stars}
              onChange={(stars) => onChange({ ...values, stars })}
              error={errors.stars}
              required
            />
          </div>
          <div className={styles.wide}>
            <TextArea
              label="Tasting note"
              optional
              name="note"
              rows={4}
              value={values.note}
              onChange={set('note')}
              error={errors.note}
              hint={`${values.note.length} of ${LIMITS.note} characters`}
            />
          </div>
        </>
      )}
      {more && (
        <>
          <TextInput
            label="Tasted on"
            name="tastedOn"
            type="date"
            max={todayIso()}
            value={values.tastedOn}
            onChange={set('tastedOn')}
            error={errors.tastedOn}
          />
          <TextInput
            label="Place"
            optional
            name="place"
            placeholder="e.g. At home"
            value={values.place}
            onChange={set('place')}
            error={errors.place}
            autoComplete="off"
          />
          <TextInput
            label="Price paid"
            optional
            name="pricePaid"
            inputMode="decimal"
            value={values.pricePaid}
            onChange={set('pricePaid')}
            error={errors.pricePaid}
            autoComplete="off"
          />
          <Select
            label="Currency"
            name="currency"
            value={values.currency}
            onChange={set('currency')}
            error={errors.currency}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </>
      )}
    </div>
  );
}
