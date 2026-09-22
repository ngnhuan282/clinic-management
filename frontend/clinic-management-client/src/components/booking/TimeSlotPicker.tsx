import { useEffect, useState } from "react";
import doctorScheduleApi from "../../api/doctorScheduleApi";

export type TimeSlot = {
    slotId: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    doctorName?: string;
    specializationName?: string;
    roomName?: string;
};

type TimeSlotPickerProps = {
    doctorId: number | string;
    selectedDate: string;
    onSelectSlot: (slotId: string) => void;
};

const toTime = (value: string) => value.slice(0, 5);

export default function TimeSlotPicker({ doctorId, selectedDate, onSelectSlot }: TimeSlotPickerProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (!doctorId || !selectedDate) {
            setSlots([]);
            return undefined;
        }
        setLoading(true);
        doctorScheduleApi.availableSlots({ doctorId, date: selectedDate })
            .then((response) => {
                if (!cancelled) setSlots(doctorScheduleApi.unwrap(response));
            })
            .catch(() => {
                if (!cancelled) setSlots([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [doctorId, selectedDate]);

    if (loading) {
        return <div className="slot-grid" aria-label="Đang tải khung giờ">{Array.from({ length: 8 }).map((_, index) => <span className="slot-skeleton" key={index} />)}</div>;
    }

    return (
        <div className="slot-grid">
            {slots.map((slot) => (
                <button
                    className={`slot-chip ${slot.isAvailable ? "slot-chip-available" : "slot-chip-full"}`}
                    disabled={!slot.isAvailable}
                    key={slot.slotId}
                    onClick={() => onSelectSlot(slot.slotId)}
                    type="button"
                >
                    {toTime(slot.startTime)} - {toTime(slot.endTime)}
                </button>
            ))}
            {!slots.length && <span className="slot-empty">Không có khung giờ phù hợp.</span>}
        </div>
    );
}
