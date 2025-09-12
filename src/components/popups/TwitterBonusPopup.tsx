//  const { useState, useEffect, useRef } = React;
        
//         // Particle Component for Confetti Effect
//         interface ParticleProps {
//             size: number;
//             left: number;
//             top: number;
//             rotation: number;
//             animationDuration: number;
//             animationDelay: number;
//         }
        
//         const Particle: React.FC<ParticleProps> = ({ size, left, top, rotation, animationDuration, animationDelay }) => {
//             return (
//                 <div 
//                     className="absolute rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
//                     style={{
//                         width: `${size}px`,
//                         height: `${size}px`,
//                         left: `${left}%`,
//                         top: `${top}%`,
//                         transform: `rotate(${rotation}deg)`,
//                         animation: `fall ${animationDuration}s ease-in-out infinite ${animationDelay}s`
//                     }}
//                 />
//             );
//         };
        
//         // Confetti Animation Component
//         const ConfettiAnimation: React.FC = () => {
//             const particlesRef = useRef<Array<Omit<ParticleProps, "id">>>([]);
            
//             useEffect(() => {
//                 const particles = [];
//                 for (let i = 0; i < 150; i++) {
//                     particles.push({
//                         size: Math.random() * 8 + 4,
//                         left: Math.random() * 100,
//                         top: Math.random() * 100,
//                         rotation: Math.random() * 360,
//                         animationDuration: Math.random() * 3 + 2,
//                         animationDelay: Math.random() * 2
//                     });
//                 }
//                 particlesRef.current = particles;
//             }, []);
            
//             return (
//                 <div className="fixed inset-0 pointer-events-none z-40">
//                     {particlesRef.current.map((particle, index) => (
//                         <Particle 
//                             key={index}
//                             {...particle}
//                         />
//                     ))}
//                 </div>
//             );
//         };
        
//         // Main Modal Component
//         interface TokenAwardModalProps {
//             isOpen: boolean;
//             onClose: () => void;
//             onClaim: () => void;
//         }
        
//         const TokenAwardModal: React.FC<TokenAwardModalProps> = ({ isOpen, onClose, onClaim }) => {
//             const [isClaiming, setIsClaiming] = useState<boolean>(false);
//             const [isClaimed, setIsClaimed] = useState<boolean>(false);
            
//             const handleClaim = async () => {
//                 setIsClaiming(true);
//                 // Simulate API call
//                 await new Promise(resolve => setTimeout(resolve, 2000));
//                 setIsClaiming(false);
//                 setIsClaimed(true);
//                 onClaim();
//             };
            
//             if (!isOpen) return null;
            
//             return (
//                 <>
//                     <ConfettiAnimation />
//                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//                         <div 
//                             className="absolute inset-0 bg-black/70 backdrop-blur-sm"
//                             onClick={onClose}
//                         />
//                         <motion.div
//                             initial={{ opacity: 0, scale: 0.8 }}
//                             animate={{ opacity: 1, scale: 1 }}
//                             exit={{ opacity: 0, scale: 0.8 }}
//                             transition={{ type: "spring", damping: 25, stiffness: 300 }}
//                             className="relative z-10 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-purple-500/30 overflow-hidden"
//                         >
//                             {/* Decorative elements */}
//                             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
//                             <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
//                             <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl"></div>
                            
//                             {/* Floating particles */}
//                             {[...Array(8)].map((_, i) => (
//                                 <motion.div
//                                     key={i}
//                                     className="absolute rounded-full bg-white/10"
//                                     style={{
//                                         width: `${Math.random() * 10 + 2}px`,
//                                         height: `${Math.random() * 10 + 2}px`,
//                                         top: `${Math.random() * 100}%`,
//                                         left: `${Math.random() * 100}%`,
//                                     }}
//                                     animate={{
//                                         y: [0, -20, 0],
//                                         opacity: [0.2, 0.8, 0.2],
//                                     }}
//                                     transition={{
//                                         duration: Math.random() * 3 + 2,
//                                         repeat: Infinity,
//                                         delay: Math.random() * 2,
//                                     }}
//                                 />
//                             ))}
                            
//                             <button
//                                 onClick={onClose}
//                                 className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
//                                 disabled={isClaiming || isClaimed}
//                             >
//                                 <i className="fas fa-times text-white"></i>
//                             </button>
                            
//                             <div className="relative z-10 text-center">
//                                 <motion.div 
//                                     className="mx-auto flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-lg"
//                                     animate={{ 
//                                         rotate: [0, 5, -5, 0],
//                                         scale: [1, 1.05, 1]
//                                     }}
//                                     transition={{ 
//                                         duration: 2, 
//                                         repeat: Infinity,
//                                         repeatType: "reverse"
//                                     }}
//                                 >
//                                     <i className="fas fa-gift text-white text-3xl"></i>
//                                 </motion.div>
                                
//                                 <motion.h2 
//                                     className="text-3xl md:text-4xl font-bold text-white mb-2 bg-clip-text text-transparent"
//                                     initial={{ opacity: 0, y: -10 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     transition={{ delay: 0.2 }}
//                                 >
//                                     {isClaimed ? "Bonus Claimed!" : "Congratulations!"}
//                                 </motion.h2>
                                
//                                 <motion.div 
//                                     className="flex items-center justify-center space-x-2 mb-4"
//                                     initial={{ opacity: 0 }}
//                                     animate={{ opacity: 1 }}
//                                     transition={{ delay: 0.3 }}
//                                 >
//                                     <i className="fas fa-sparkles text-yellow-400"></i>
//                                     <p className="text-xl text-purple-100">
//                                         You've earned <span className="font-bold text-yellow-400">3000 $CONNECT</span>
//                                     </p>
//                                     <i className="fas fa-sparkles text-yellow-400"></i>
//                                 </motion.div>
                                
//                                 <motion.p 
//                                     className="text-gray-300 mb-8"
//                                     initial={{ opacity: 0 }}
//                                     animate={{ opacity: 1 }}
//                                     transition={{ delay: 0.4 }}
//                                 >
//                                     For connecting your Twitter account
//                                 </motion.p>
                                
//                                 {isClaimed ? (
//                                     <motion.div 
//                                         className="flex flex-col items-center"
//                                         initial={{ opacity: 0, scale: 0.8 }}
//                                         animate={{ opacity: 1, scale: 1 }}
//                                         transition={{ delay: 0.5 }}
//                                     >
//                                         <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
//                                             <i className="fas fa-check-circle text-green-400 text-3xl"></i>
//                                         </div>
//                                         <p className="text-green-400 font-medium">Tokens added to your balance!</p>
//                                     </motion.div>
//                                 ) : (
//                                     <motion.button
//                                         onClick={handleClaim}
//                                         disabled={isClaiming}
//                                         className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 disabled:opacity-70 flex items-center justify-center space-x-2 relative overflow-hidden"
//                                         whileHover={{ scale: 1.02 }}
//                                         whileTap={{ scale: 0.98 }}
//                                     >
//                                         <span className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
//                                         <span className="relative flex items-center space-x-2">
//                                             {isClaiming ? (
//                                                 <>
//                                                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                                     </svg>
//                                                     <span>Claiming...</span>
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <i className="fas fa-coins"></i>
//                                                     <span>Claim Your Tokens</span>
//                                                 </>
//                                             )}
//                                         </span>
//                                     </motion.button>
//                                 )}
                                
//                                 <motion.p 
//                                     className="text-gray-400 text-sm mt-6"
//                                     initial={{ opacity: 0 }}
//                                     animate={{ opacity: 1 }}
//                                     transition={{ delay: 0.6 }}
//                                 >
//                                     This bonus is only available for first-time Twitter connections
//                                 </motion.p>
//                             </div>
//                         </motion.div>
//                     </div>
//                 </>
//             );
//         };
        
//         // Usage Example Component
//         const App: React.FC = () => {
//             const [showModal, setShowModal] = useState<boolean>(true);
            
//             const handleClose = () => {
//                 setShowModal(false);
//             };
            
//             const handleClaim = () => {
//                 console.log("Token claimed!");
//                 // Here you would typically update state or call an API
//             };
            
//             return (
//                 <div className="min-h-screen bg-gray-900 flex items-center justify-center">
//                     <TokenAwardModal 
//                         isOpen={showModal} 
//                         onClose={handleClose} 
//                         onClaim={handleClaim} 
//                     />
//                 </div>
//             );
//         };
        




 import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
        
        // Particle Component for Confetti Effect
        interface ParticleProps {
            size: number;
            left: number;
            top: number;
            rotation: number;
            animationDuration: number;
            animationDelay: number;
        }
        
        const Particle: React.FC<ParticleProps> = ({ size, left, top, rotation, animationDuration, animationDelay }) => {
            return (
                <div 
                    className="absolute rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        left: `${left}%`,
                        top: `${top}%`,
                        transform: `rotate(${rotation}deg)`,
                        animation: `fall ${animationDuration}s ease-in-out infinite ${animationDelay}s`
                    }}
                />
            );
        };
        
        // Confetti Animation Component
     export function ConfettiAnimation(){
            const particlesRef = useRef<Array<Omit<ParticleProps, "id">>>([]);
            
            useEffect(() => {
                const particles = [];
                for (let i = 0; i < 150; i++) {
                    particles.push({
                        size: Math.random() * 8 + 4,
                        left: Math.random() * 100,
                        top: Math.random() * 100,
                        rotation: Math.random() * 360,
                        animationDuration: Math.random() * 3 + 2,
                        animationDelay: Math.random() * 2
                    });
                }
                particlesRef.current = particles;
            }, []);
            
            return (
                <div className="fixed inset-0 pointer-events-none z-40">
                    {particlesRef.current.map((particle, index) => (
                        <Particle 
                            key={index}
                            {...particle}
                        />
                    ))}
                </div>
            );
        };
        
        // Main Modal Component
        interface TokenAwardModalProps {
            isOpen: boolean;
            onClose: () => void;
            onClaim: () => void;
        }
        
      export function TokenAwardModal({ isOpen, onClose, onClaim }:TokenAwardModalProps){
            const [isClaiming, setIsClaiming] = useState<boolean>(false);
            const [isClaimed, setIsClaimed] = useState<boolean>(false);
            
            const handleClaim = async () => {
                setIsClaiming(true);
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 2000));
                setIsClaiming(false);
                setIsClaimed(true);
                onClaim();
            };
            
            if (!isOpen) return null;
            
            return (
                <>
                    <ConfettiAnimation />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div 
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative z-10 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-purple-500/30 overflow-hidden"
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl"></div>
                            
                            {/* Floating particles */}
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full bg-white/10"
                                    style={{
                                        width: `${Math.random() * 10 + 2}px`,
                                        height: `${Math.random() * 10 + 2}px`,
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        y: [0, -20, 0],
                                        opacity: [0.2, 0.8, 0.2],
                                    }}
                                    transition={{
                                        duration: Math.random() * 3 + 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2,
                                    }}
                                />
                            ))}
                            
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                                disabled={isClaiming || isClaimed}
                            >
                                <i className="fas fa-times text-white"></i>
                            </button>
                            
                            <div className="relative z-10 text-center">
                                <motion.div 
                                    className="mx-auto flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-lg"
                                    animate={{ 
                                        rotate: [0, 5, -5, 0],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{ 
                                        duration: 2, 
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }}
                                >
                                    <i className="fas fa-gift text-white text-3xl"></i>
                                </motion.div>
                                
                                <motion.h2 
                                    className="text-3xl md:text-4xl font-bold text-white mb-2 bg-clip-text text-transparent"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {isClaimed ? "Bonus Claimed!" : "Congratulations!"}
                                </motion.h2>
                                
                                <motion.div 
                                    className="flex items-center justify-center space-x-2 mb-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <i className="fas fa-sparkles text-yellow-400"></i>
                                    <p className="text-xl text-purple-100">
                                        You've earned <span className="font-bold text-yellow-400">3000 $CONNECT</span>
                                    </p>
                                    <i className="fas fa-sparkles text-yellow-400"></i>
                                </motion.div>
                                
                                <motion.p 
                                    className="text-gray-300 mb-8"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    For connecting your Twitter account
                                </motion.p>
                                
                                {isClaimed ? (
                                    <motion.div 
                                        className="flex flex-col items-center"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                            <i className="fas fa-check-circle text-green-400 text-3xl"></i>
                                        </div>
                                        <p className="text-green-400 font-medium">Tokens added to your balance!</p>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        onClick={handleClaim}
                                        disabled={isClaiming}
                                        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 disabled:opacity-70 flex items-center justify-center space-x-2 relative overflow-hidden"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                        <span className="relative flex items-center space-x-2">
                                            {isClaiming ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Claiming...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-coins"></i>
                                                    <span>Claim Your Tokens</span>
                                                </>
                                            )}
                                        </span>
                                    </motion.button>
                                )}
                                
                                <motion.p 
                                    className="text-gray-400 text-sm mt-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    This bonus is only available for first-time Twitter connections
                                </motion.p>
                            </div>
                        </motion.div>
                    </div>
                </>
            );
        };
        
        // // Usage Example Component
        // const App: React.FC = () => {
        //     const [showModal, setShowModal] = useState<boolean>(true);
            
        //     const handleClose = () => {
        //         setShowModal(false);
        //     };
            
        //     const handleClaim = () => {
        //         console.log("Token claimed!");
        //         // Here you would typically update state or call an API
        //     };
            
        //     return (
        //         <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        //             <TokenAwardModal 
        //                 isOpen={showModal} 
        //                 onClose={handleClose} 
        //                 onClaim={handleClaim} 
        //             />
        //         </div>
        //     );
        // };
        