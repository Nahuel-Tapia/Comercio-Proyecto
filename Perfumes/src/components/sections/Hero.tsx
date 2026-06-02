import React from 'react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-brand-light">
      
      {/* Narrative Section (Left on Desktop, Bottom on Mobile) */}
      <div className="w-full md:w-[45%] bg-[#F3F0E9] flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 py-24 md:py-32 z-10 order-2 md:order-1 relative">
        {/* Subtle background texture or simple lines */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-brand-dark/5 hidden md:block"></div>
        
        <div className="max-w-md space-y-8">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs uppercase tracking-[0.3em] text-brand-dark/45 font-medium block"
          >
            Lé Désir Fragancias
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif text-brand-dark leading-[1.15] font-light lowercase"
          >
            la memoria <br />
            de los <span className="italic text-brand-gold font-normal">sentidos</span>.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="text-sm sm:text-base text-brand-dark/65 font-light leading-relaxed max-w-sm"
          >
            Fragancias atemporales de fijación perpetua. Elaboradas meticulosamente para evocar emociones íntimas y dejar una estela inolvidable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="pt-4 flex flex-col sm:flex-row gap-6 sm:items-center"
          >
            {/* Minimal Underlined Link with hover extension */}
            <a 
              href="/shop" 
              className="group inline-flex items-center space-x-3 text-xs uppercase tracking-[0.25em] font-semibold text-brand-dark transition-colors"
            >
              <span>Explorar catálogo</span>
              <span className="h-[1px] bg-brand-dark w-8 group-hover:w-16 transition-all duration-300 ease-out"></span>
            </a>
            
            <a 
              href="/about" 
              className="text-xs uppercase tracking-[0.25em] text-brand-dark/50 hover:text-brand-dark transition-colors font-medium border-b border-brand-dark/10 hover:border-brand-dark pb-0.5 self-start sm:self-auto"
            >
              Nuestra historia
            </a>
          </motion.div>
        </div>

        {/* Brand values list in small text */}
        <div className="absolute bottom-8 left-8 sm:left-12 md:left-16 lg:left-20 hidden md:block">
          <div className="flex space-x-6 text-[10px] uppercase tracking-widest text-brand-dark/35 font-medium">
            <span>• Alta fijación</span>
            <span>• Concentrado de autor</span>
            <span>• Cruelty free</span>
          </div>
        </div>
      </div>

      {/* Visual Section (Right on Desktop, Top on Mobile) */}
      <div className="w-full md:w-[55%] h-[50vh] md:h-screen relative overflow-hidden order-1 md:order-2">
        <motion.div 
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1] }}
          className="w-full h-full"
        >
          <img 
            src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop" 
            alt="Frasco de perfume en atmósfera minimalista" 
            className="w-full h-full object-cover"
          />
          {/* Subtle warm overlay over the photo */}
          <div className="absolute inset-0 bg-[#FAF9F6]/5 mix-blend-overlay"></div>
        </motion.div>
        
        {/* Aesthetic vertical tag */}
        <div className="absolute bottom-10 right-10 hidden lg:block z-10">
          <span className="text-[9px] uppercase tracking-[0.4em] text-brand-white/80 writing-vertical select-none font-light">
            lé désir boutique
          </span>
        </div>
      </div>
    </section>
  );
}
