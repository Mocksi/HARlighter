interface ButtonProps {
  children: string;
  onClick: () => void;
  variant?: 'primary'|'secondary'
  className?: string
}
const Button = ({children, onClick, variant = 'primary', className}: ButtonProps) => {
  const styles = variant === 'primary' ? 'bg-[#E8F3EC] border-[#E8F3EC]' : 'border-[#009875]';
  return (
    <div
      className={`border text-[#009875] w-fit h-[42px] rounded-full flex items-center justify-center cursor-pointer px-6 ${styles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Button;
