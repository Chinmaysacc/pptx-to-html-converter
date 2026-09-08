interface ConvertButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function ConvertButton({ onClick, disabled }: ConvertButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {disabled ? "Converting..." : "Convert to HTML"}
    </button>
  );
}
