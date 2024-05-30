interface TextProps {
  children: string;
  className?: string;
  variant?: 'regular'|'title';
}

const TextField = ({children, variant = 'regular', className}: TextProps) => {
  const title = variant === 'title' ? 'font-medium' : '';
  return (
    <div className={`text-[15px] leading-[18px] ${title} ${className ?? ''}`}>
      {children}
    </div>
  )
}

export default TextField;
