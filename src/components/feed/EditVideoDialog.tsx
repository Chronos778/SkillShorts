import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, CheckCircle } from 'lucide-react';
import { updateVideo, updateQuizQuestions, getVideoById } from '@/services/videos';
import { Video, QuizQuestion } from '@/types';
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
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

interface QuizQuestionEdit {
    question: string;
    options: string[];
    correct_answer: number;
}

const EditVideoDialog: React.FC<EditVideoDialogProps> = ({ video, open, onOpenChange }) => {
    const [title, setTitle] = useState(video.title);
    const [description, setDescription] = useState(video.description);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestionEdit[]>([
        { question: "", options: ["", "", "", ""], correct_answer: 0 },
    ]);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch video with quiz questions when dialog opens
    const { data: videoData, isLoading: loadingQuiz } = useQuery({
        queryKey: ['video-edit', video.id],
        queryFn: () => getVideoById(video.id),
        enabled: open,
    });

    // Update state when quiz questions are loaded
    useEffect(() => {
        if (videoData?.questions && videoData.questions.length > 0) {
            setQuizQuestions(
                videoData.questions.map((q: QuizQuestion) => ({
                    question: q.question,
                    options: q.options,
                    correct_answer: q.correct_answer,
                }))
            );
        }
    }, [videoData]);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            setTitle(video.title);
            setDescription(video.description);
        }
    }, [open, video]);

    const addQuestion = () => {
        if (quizQuestions.length >= 3) {
            toast({ title: "Maximum 3 questions per video", variant: "destructive" });
            return;
        }
        setQuizQuestions([
            ...quizQuestions,
            { question: "", options: ["", "", "", ""], correct_answer: 0 },
        ]);
    };

    const removeQuestion = (index: number) => {
        if (quizQuestions.length <= 1) {
            toast({ title: "At least 1 question is required", variant: "destructive" });
            return;
        }
        setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof QuizQuestionEdit, value: string | number) => {
        const updated = [...quizQuestions];
        updated[index] = { ...updated[index], [field]: value };
        setQuizQuestions(updated);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const updated = [...quizQuestions];
        updated[qIndex].options[oIndex] = value;
        setQuizQuestions(updated);
    };

    const updateMutation = useMutation({
        mutationFn: async () => {
            // Validate quiz questions
            if (!quizQuestions.every(q => q.question && q.options.every(o => o))) {
                throw new Error('Please complete all quiz questions and options');
            }

            // Update video details
            const videoUpdates = { title, description };
            const videoSuccess = await updateVideo(video.id, videoUpdates);
            if (!videoSuccess) throw new Error('Failed to update video');

            // Update quiz questions
            const quizSuccess = await updateQuizQuestions(video.id, quizQuestions);
            if (!quizSuccess) throw new Error('Failed to update quiz questions');

            return { videoUpdates, quizQuestions };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['videos'] });
            queryClient.invalidateQueries({ queryKey: ['video', video.id] });
            queryClient.invalidateQueries({ queryKey: ['video-edit', video.id] });

            toast({ title: "Video and quiz updated successfully" });
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast({ title: error.message || "Failed to update video", variant: "destructive" });
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-zinc-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Video & Quiz</DialogTitle>
                </DialogHeader>
                {loadingQuiz ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        {/* Video Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider">Video Details</h3>
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
                        </div>

                        {/* Quiz Questions */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider">Quiz Questions</h3>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                    {quizQuestions.length}/3 QUESTIONS
                                </span>
                            </div>

                            <div className="space-y-4">
                                {quizQuestions.map((q, i) => (
                                    <div key={i} className="p-4 border border-white/10 bg-black/30 rounded-lg relative">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-mono text-[10px] font-bold">Q_0{i + 1}</span>
                                            {quizQuestions.length > 1 && (
                                                <Trash2
                                                    onClick={() => removeQuestion(i)}
                                                    className="w-4 h-4 cursor-pointer hover:text-red-500 transition-colors"
                                                />
                                            )}
                                        </div>
                                        <Input
                                            value={q.question}
                                            onChange={(e) => updateQuestion(i, "question", e.target.value)}
                                            placeholder="QUESTION TEXT"
                                            className="mb-3 font-bold text-sm bg-black/50 border-white/10"
                                        />
                                        <div className="grid grid-cols-1 gap-2">
                                            {q.options.map((opt, oIdx) => (
                                                <div
                                                    key={oIdx}
                                                    className={cn(
                                                        "flex items-center gap-2 p-2 border rounded cursor-pointer transition-all",
                                                        q.correct_answer === oIdx
                                                            ? "border-green-500 bg-green-500/10"
                                                            : "border-white/10 hover:border-white/30"
                                                    )}
                                                    onClick={() => updateQuestion(i, "correct_answer", oIdx)}
                                                >
                                                    <div
                                                        className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                            q.correct_answer === oIdx
                                                                ? "border-green-500 bg-green-500"
                                                                : "border-gray-500"
                                                        )}
                                                    >
                                                        {q.correct_answer === oIdx && (
                                                            <CheckCircle className="w-3 h-3 text-white" />
                                                        )}
                                                    </div>
                                                    <Input
                                                        value={opt}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            updateOption(i, oIdx, e.target.value);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        placeholder={`Option ${oIdx + 1}`}
                                                        className="text-xs border-0 bg-transparent p-0 h-auto focus-visible:ring-0 shadow-none"
                                                    />
                                                    {q.correct_answer === oIdx && (
                                                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider shrink-0">
                                                            ✓ CORRECT
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            <p className="text-[10px] font-mono text-gray-400 mt-1">
                                                Click an option to mark it as the correct answer
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {quizQuestions.length < 3 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addQuestion}
                                    className="w-full border-dashed border-white/20 hover:bg-white/10 hover:text-white uppercase text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Add Question
                                </Button>
                            )}
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
                )}
            </DialogContent>
        </Dialog>
    );
};

export default EditVideoDialog;
