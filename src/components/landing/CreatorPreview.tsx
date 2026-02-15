import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Button from './ui/Button';
import { UploadCloud, CheckCircle2, Image as ImageIcon, Film } from 'lucide-react';

const CreatorPreview: React.FC = () => {
   const { isSignedIn } = useUser();
   const navigate = useNavigate();

   const handleCreatorClick = () => {
      if (isSignedIn) {
         navigate('/creator');
      } else {
         navigate('/sign-up');
      }
   };

   return (
      <div id="creators" className="py-24 bg-swiss-white dark:bg-swiss-darkBg border-b-2 border-black dark:border-white overflow-hidden transition-colors duration-300">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

               <div className="order-2 lg:order-1">
                  {/* Mock UI Window */}
                  <div className="border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white bg-swiss-white dark:bg-swiss-darkBg p-2 transition-colors">
                     {/* Window Header */}
                     <div className="bg-black dark:bg-white dark:text-black text-white p-2 mb-2 flex justify-between items-center">
                        <span className="font-mono text-xs uppercase pl-2 font-bold">creator_studio.exe</span>
                        <div className="flex gap-1">
                           <div className="w-3 h-3 bg-white dark:bg-black border border-black dark:border-white"></div>
                           <div className="w-3 h-3 bg-white dark:bg-black border border-black dark:border-white"></div>
                        </div>
                     </div>

                     {/* Window Content */}
                     <div className="p-6 border-2 border-swiss-gray dark:border-gray-800 bg-swiss-gray/20 dark:bg-white/5 border-dashed">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                           <div className="w-16 h-16 border-2 border-black dark:border-white bg-white dark:bg-black flex items-center justify-center mb-4 shadow-hard-sm dark:shadow-hard-sm-white transition-colors">
                              <UploadCloud size={32} className="dark:text-white" />
                           </div>
                           <h4 className="font-bold uppercase mb-2 dark:text-white">Drag & Drop Video Source</h4>
                           <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Supports .MP4, .MOV or Paste YouTube Link. Max size 500MB.</p>
                           <Button size="sm" variant="secondary">Select File</Button>
                        </div>
                     </div>

                     {/* Progress List */}
                     <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-black border-2 border-black dark:border-white transition-colors">
                           <div className="flex items-center gap-3">
                              <Film size={16} className="dark:text-white" />
                              <span className="font-mono text-xs font-bold dark:text-white">react_hooks_tutorial.mp4</span>
                           </div>
                           <CheckCircle2 size={16} className="text-swiss-blue dark:text-swiss-vibrantBlue" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-black border-2 border-black dark:border-white opacity-50 transition-colors">
                           <div className="flex items-center gap-3">
                              <ImageIcon size={16} className="dark:text-white" />
                              <span className="font-mono text-xs font-bold dark:text-white">Generating Thumbnail...</span>
                           </div>
                           <div className="w-4 h-4 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin"></div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="order-1 lg:order-2">
                  <span className="font-mono text-swiss-blue dark:text-swiss-vibrantBlue font-bold uppercase tracking-widest text-sm mb-2 block">Creator Ecosystem</span>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6 dark:text-white">Contribute to<br />The Database</h2>
                  <p className="text-lg text-swiss-darkGray dark:text-gray-300 mb-8 leading-relaxed font-sans">
                     Share your expertise with the world. Our creator tools are designed for speed.
                     Upload raw video or link existing content, and our system handles the rest—including
                     automatic thumbnail generation and quiz structuring.
                  </p>

                  <ul className="space-y-4 font-mono text-sm mb-8 dark:text-gray-200">
                     <li className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-swiss-blue dark:bg-swiss-vibrantBlue"></div>
                        <span>AUTO_TRANSCRIPTION_ENABLED</span>
                     </li>
                     <li className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-swiss-black dark:bg-white"></div>
                        <span>QUIZ_GENERATION_BETA</span>
                     </li>
                     <li className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600"></div>
                        <span>MONETIZATION_READY</span>
                     </li>
                  </ul>

                  <Button onClick={handleCreatorClick}>Become a Creator</Button>
               </div>

            </div>
         </div>
      </div>
   );
};

export default CreatorPreview;
