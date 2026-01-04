import React from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, Zap } from 'lucide-react';

const MobileControls = () => {
    // These are placeholders for visual elements. 
    // They work by dispatching keyboard events to the window, 
    // which the GameCanvas will listen to.

    const dispatchKey = (key, type) => {
        const keyCodeMap = {
            'ArrowLeft': 37,
            'ArrowRight': 39,
            'ArrowUp': 38,
            'Space': 32
        };
        const event = new KeyboardEvent(type, {
            key: key,
            keyCode: keyCodeMap[key],
            bubbles: true
        });
        window.dispatchEvent(event);
    };

    const handleAction = (key, isDown) => {
        dispatchKey(key, isDown ? 'keydown' : 'keyup');
    };

    return (
        <div id="mobile-controls" className="active">
            <div className="control-group">
                <div
                    className="btn-ctrl"
                    id="btn-left"
                    onPointerDown={() => handleAction('ArrowLeft', true)}
                    onPointerUp={() => handleAction('ArrowLeft', false)}
                    onPointerLeave={() => handleAction('ArrowLeft', false)}
                >
                    <ChevronLeft size={32} />
                </div>
                <div
                    className="btn-ctrl"
                    id="btn-right"
                    onPointerDown={() => handleAction('ArrowRight', true)}
                    onPointerUp={() => handleAction('ArrowRight', false)}
                    onPointerLeave={() => handleAction('ArrowRight', false)}
                >
                    <ChevronRight size={32} />
                </div>
            </div>
            <div className="control-group">
                <div
                    className="btn-ctrl"
                    id="btn-thrust"
                    onPointerDown={() => handleAction('ArrowUp', true)}
                    onPointerUp={() => handleAction('ArrowUp', false)}
                    onPointerLeave={() => handleAction('ArrowUp', false)}
                >
                    <ChevronUp size={32} />
                </div>
                <div
                    className="btn-ctrl"
                    id="btn-shoot"
                    onPointerDown={() => handleAction('Space', true)}
                    onPointerUp={() => handleAction('Space', false)}
                >
                    <Zap size={32} />
                </div>
            </div>
        </div>
    );
};

export default MobileControls;
