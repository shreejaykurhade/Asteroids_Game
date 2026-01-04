import { ChevronLeft, ChevronRight, ChevronUp, Zap, Radio } from 'lucide-react';

const MobileControls = () => {
    const dispatchKey = (key, type) => {
        const keyCodeMap = {
            'ArrowLeft': 37,
            'ArrowRight': 39,
            'ArrowUp': 38,
            'Space': 32,
            'Shift': 16
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
                >
                    <ChevronLeft size={32} />
                </div>
                <div
                    className="btn-ctrl"
                    id="btn-right"
                    onPointerDown={() => handleAction('ArrowRight', true)}
                    onPointerUp={() => handleAction('ArrowRight', false)}
                >
                    <ChevronRight size={32} />
                </div>
            </div>
            <div className="control-group action-group">
                <div
                    className="btn-ctrl"
                    id="btn-ability"
                    onPointerDown={() => handleAction('Shift', true)}
                    onPointerUp={() => handleAction('Shift', false)}
                >
                    <Radio size={32} />
                </div>
                <div
                    className="btn-ctrl"
                    id="btn-thrust"
                    onPointerDown={() => handleAction('ArrowUp', true)}
                    onPointerUp={() => handleAction('ArrowUp', false)}
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
