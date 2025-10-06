import React, { useState } from 'react';
import { Power, PowerOff, Zap, ZapOff } from 'lucide-react';
import Button from './ui/Button/Button';
import toast from 'react-hot-toast';

const RestaurantControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleRestaurant = async () => {
    setLoading(true);
    setIsOpen(!isOpen);
    toast.success(`Restaurant ${!isOpen ? 'opened' : 'closed'}`);
    setLoading(false);
  };

  const toggleAutoAccept = async () => {
    setLoading(true);
    setAutoAccept(!autoAccept);
    toast.success(`Auto-accept ${!autoAccept ? 'enabled' : 'disabled'}`);
    setLoading(false);
  };

  return (
    <div className="flex space-x-4 items-center">
      <Button
        variant={isOpen ? 'danger' : 'success'}
        onClick={toggleRestaurant}
        loading={loading}
        className="flex items-center space-x-2 elevated"
      >
        {isOpen ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
        <span>{isOpen ? 'Close Restaurant' : 'Open Restaurant'}</span>
      </Button>

      <Button
        variant={autoAccept ? 'warning' : 'primary'}
        onClick={toggleAutoAccept}
        loading={loading}
        className="flex items-center space-x-2 elevated"
      >
        {autoAccept ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
        <span>{autoAccept ? 'Disable Auto-Accept' : 'Enable Auto-Accept'}</span>
      </Button>

      <div className="glass rounded-lg px-4 py-2 text-sm flex items-center space-x-4">
        <div className={`status-indicator ${isOpen ? 'online' : 'offline'}`}>
          <div className={`status-dot ${isOpen ? 'online' : 'offline'}`}></div>
          <span>{isOpen ? 'Open' : 'Closed'}</span>
        </div>
        
        <div className={`status-indicator ${autoAccept ? 'online' : 'offline'}`}>
          <div className={`status-dot ${autoAccept ? 'online' : 'offline'}`}></div>
          <span>Auto-Accept {autoAccept ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantControls;