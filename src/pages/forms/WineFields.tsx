import { useMemo } from 'react';
import { Select, TextInput } from '../../components/TextInput/TextInput';
import { countryOptions } from '../../domain/countries';
import type { FieldErrors, WineFormValues } from '../../domain/schemas';
import { WINE_TYPES, WINE_TYPE_LABELS } from '../../domain/types';
import styles from './Forms.module.css';

export interface WineFieldsProps {
  values: WineFormValues;
  errors: FieldErrors<WineFormValues>;
  onChange: (values: WineFormValues) => void;
  /** main: name, producer, vintage, type. more: the rest. all: everything. */
  show?: 'all' | 'main' | 'more';
}

export const WINE_MORE_FIELDS = ['country', 'region', 'abv', 'grapes'] as const;

/** The fields that describe a wine. Only the name is required. */
export function WineFields({ values, errors, onChange, show = 'all' }: WineFieldsProps) {
  const main = show !== 'more';
  const more = show !== 'main';
  const countries = useMemo(countryOptions, []);
  const set = (key: keyof WineFormValues) => (event: { target: { value: string } }) =>
    onChange({ ...values, [key]: event.target.value });

  return (
    <div className={styles.grid}>
      {main && (
        <>
          <div className={styles.wide}>
            <TextInput
              label="Wine name"
              name="name"
              value={values.name}
              onChange={set('name')}
              error={errors.name}
              required
              autoComplete="off"
              maxLength={220}
            />
          </div>
          <TextInput
            label="Producer"
            optional
            name="producer"
            value={values.producer}
            onChange={set('producer')}
            error={errors.producer}
            autoComplete="off"
          />
          <TextInput
            label="Vintage"
            optional
            name="vintage"
            inputMode="numeric"
            placeholder="e.g. 2019"
            value={values.vintage}
            onChange={set('vintage')}
            error={errors.vintage}
            autoComplete="off"
          />
          <Select
            label="Type"
            optional
            name="type"
            value={values.type}
            onChange={set('type')}
            error={errors.type}
          >
            <option value="">Not set</option>
            {WINE_TYPES.map((type) => (
              <option key={type} value={type}>
                {WINE_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </>
      )}
      {more && (
        <>
          <Select
            label="Country"
            optional
            name="country"
            value={values.country}
            onChange={set('country')}
            error={errors.country}
          >
            <option value="">Not set</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </Select>
          <TextInput
            label="Region"
            optional
            name="region"
            value={values.region}
            onChange={set('region')}
            error={errors.region}
            autoComplete="off"
          />
          <TextInput
            label="Alcohol (% ABV)"
            optional
            name="abv"
            inputMode="decimal"
            placeholder="e.g. 13.5"
            value={values.abv}
            onChange={set('abv')}
            error={errors.abv}
            autoComplete="off"
          />
          <div className={styles.wide}>
            <TextInput
              label="Grapes"
              optional
              name="grapes"
              hint="Separate grapes with commas."
              value={values.grapes}
              onChange={set('grapes')}
              error={errors.grapes}
              autoComplete="off"
            />
          </div>
        </>
      )}
    </div>
  );
}
