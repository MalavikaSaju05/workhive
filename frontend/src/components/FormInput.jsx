/**
 * FormInput
 *
 * A styled, reusable text input with a label and optional inline
 * validation error message. Used across the Login and Register pages.
 *
 * @param {object} props
 * @param {string} props.label - Visible label text
 * @param {string} props.name - input name/id, also used as the htmlFor target
 * @param {string} props.type - input type (text, email, password, etc.)
 * @param {string} props.value - controlled input value
 * @param {function} props.onChange - change handler
 * @param {string} [props.error] - validation error message to display
 * @param {string} [props.placeholder] - placeholder text
 * @param {boolean} [props.autoComplete] - autocomplete hint
 */
const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-secondary">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-secondary placeholder:text-gray-400 outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
          error
            ? 'border-red-400 focus:border-red-400'
            : 'border-border focus:border-primary'
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default FormInput;
