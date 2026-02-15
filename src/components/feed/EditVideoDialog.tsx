import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { updateVideo } from '@/services/videos';
import { Video } from '@/types';
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EditVideoDialogProps {
    video: Video;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EditVideoDialog: React.FC<EditVideoDialogProps> = ({ video, open, onOpenChange }) => {
    const [title, setTitle] = useState(video.title);
    const [description, setDescription] = useState(video.description);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: async () => {
            const updates = { title, description };
            const success = await updateVideo(video.id, updates);
            if (!success) throw new Error('Failed to update video');
            return updates;
        },
        onSuccess: (updates) => {
            queryClient.invalidateQueries({ queryKey: ['videos'] });
            // Also invalidate specific video queries if any
            queryClient.invalidateQueries({ queryKey: ['video', video.id] });

            toast({ title: "Video updated successfully" });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: "Failed to update video", variant: "destructive" });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast({ title: "Title is required", variant: "destructive" });
            return;
        }
        updateMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Video</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium">
                            Title
                        </label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-black/50 border-white/10 text-white"
                            placeholder="Video title"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-black/50 border-white/10 text-white min-h-[100px]"
                            placeholder="Video description"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="hover:bg-white/10 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="bg-white text-black hover:bg-gray-200"
                        >
                            {updateMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditVideoDialog;
