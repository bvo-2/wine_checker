"use client";

import { useActionState } from "react";
import { addWineAction, type AddWineState } from "@/app/actions";
import { Icon } from "@/components/Icon";
import { WINE_TYPES } from "@/lib/types";

function Field({
  name,
  label,
  error,
  defaultValue,
  className,
  ...rest
}: { name: string; label: string; error?: string; defaultValue?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const errId = `${name}-error`;
  return (
    <label className={`dc-field ${className ?? ""}`}>
      <span className="dc-field__label">{label}</span>
      <input
        className="dc-input"
        name={name}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        {...rest}
      />
      {error && (
        <span id={errId} className="dc-field__error">
          <Icon name="alert" size={16} /> {error}
        </span>
      )}
    </label>
  );
}

export function AddWineForm() {
  const [state, formAction, pending] = useActionState<AddWineState, FormData>(addWineAction, {});
  const v = state.values ?? {};
  const e = state.errors ?? {};
  return (
    <form action={formAction} className="dc-form-grid" noValidate>
      <Field name="name" label="Wine" className="span-2" placeholder="Barolo Cannubi" defaultValue={v.name} error={e.name} required />
      <Field name="winery" label="Producer" placeholder="Brezza" defaultValue={v.winery} />
      <Field name="vintage" label="Vintage" placeholder="2018" inputMode="numeric" defaultValue={v.vintage} error={e.vintage} />
      <Field name="region" label="Region" placeholder="Piedmont" defaultValue={v.region} />
      <Field name="country" label="Country" placeholder="Italy" defaultValue={v.country} />
      <label className="dc-field">
        <span className="dc-field__label">Type</span>
        <select className="dc-input" name="type" defaultValue={v.type ?? ""}>
          <option value="">Choose a type</option>
          {WINE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="dc-field">
        <span className="dc-field__label">Your rating</span>
        <select className="dc-input" name="score" defaultValue={v.score ?? ""} aria-invalid={e.score ? true : undefined}>
          <option value="">Not rated yet</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
        {e.score && (
          <span className="dc-field__error">
            <Icon name="alert" size={16} /> {e.score}
          </span>
        )}
      </label>
      <label className="dc-field span-2">
        <span className="dc-field__label">Tasting note</span>
        <textarea className="dc-input" name="note" defaultValue={v.note} placeholder="Dark cherry, violets and a long, dusty finish." maxLength={4000} />
      </label>
      <div className="span-2">
        <button type="submit" className="dc-button dc-button--primary" disabled={pending}>
          {pending ? "Adding…" : "Add to cellar"}
        </button>
      </div>
    </form>
  );
}
