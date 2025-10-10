interface ButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function Button({
  text,
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
}
