import Modal from './ui/Modal';
import { Mail, Github, Globe } from 'lucide-react';

export default function AboutDevelopersModal({ isOpen, onClose }) {
  const developers = [
    {
      name: 'PRADHYUMN GUPTA',
      email: 'pradhyumngupta43@gmail.com',
      role: 'Full Stack Developer',
      image: '/dev-pradhyumn.jpg',
    },
    {
      name: 'OM KUMAR YADAV',
      email: 'rohityadav80130@gmail.com',
      role: 'Full Stack Developer',
      image: '/dev-om.jpg',
    },
    {
      name: 'HARSH BOHRA',
      email: 'harshbohra41@gmail.com',
      role: 'Full Stack Developer',
      image: '/dev-harsh.jpg',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About Developers" size="lg">
      <div className="py-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {developers.map((dev, idx) => (
            <div 
              key={idx} 
              className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Profile Image Wrapper */}
              <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-white ring-4 ring-primary-100 group-hover:ring-primary-350 transition-all duration-300 shadow-inner">
                <img 
                  src={dev.image} 
                  alt={dev.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                  }}
                />
              </div>

              {/* Dev Details */}
              <h4 className="text-sm font-bold text-slate-800 tracking-tight uppercase">
                {dev.name}
              </h4>
              <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider mt-1">
                {dev.role}
              </p>
              
              {/* Divider */}
              <div className="w-8 h-[2px] bg-slate-200 my-3 group-hover:w-12 transition-all duration-300" />

              {/* Email Link */}
              <a 
                href={`mailto:${dev.email}`}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors font-medium break-all px-2 py-1 bg-white rounded-lg border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/20"
              >
                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-blue-500" />
                <span className="truncate max-w-[150px]">{dev.email}</span>
              </a>
            </div>
          ))}
        </div>

        {/* Technical Stack Tagline */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Vehicle Requisition & Travel Portal (VRTP)
          </p>
        </div>
      </div>
    </Modal>
  );
}
