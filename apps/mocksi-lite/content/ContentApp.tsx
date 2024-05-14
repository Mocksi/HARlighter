import { useState } from 'react'
import mocksiLogo from '../public/mocksi-logo.png'
import closeIcon from '../public/close-icon.png'

export default function ContentApp() {
  const [isdialogOpen, setIsDialogOpen] = useState(true)
  const [isRecording, setIsRecording] = useState(false)

  if (!isdialogOpen) return null
  return (
    <div className="border border-grey/40 rounded bg-white h-11 w-64 mt-4 mr-8 flex flex-row items-center">
      <div className='flex flex-row w-[80%] gap-2'>
        <div className='ml-2 cursor-pointer' onClick={() => setIsDialogOpen(false)}>
          <img src={closeIcon}/>
        </div>  
        <img className='w-[30px] h-[20px]' src={mocksiLogo}/>
        <span className='font-medium text-[#000F0C] text-sm'>
          {isRecording ? 'Mocksi Recording' : 'Record your app'}
        </span>
      </div>
      <button className={`h-full w-[56px] border-r-2 text-center ${isRecording ? 'bg-crimson/95': 'bg-green/95'}`} 
        onClick={() => setIsRecording(!isRecording)}>
        {isRecording ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}
