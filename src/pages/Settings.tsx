import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { getUserByClerkId, updateUser } from '@/services/users';
import { Loader2, Save, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Settings() {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [customAvatarUrl, setCustomAvatarUrl] = useState('');

    const { data: dbUser, isLoading } = useQuery({
        queryKey: ['db-user', user?.id],
        queryFn: async () => {
             if (!user) return null;
             const u = await getUserByClerkId(user.id);
             return u;
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (dbUser) {
            setName(dbUser.name || '');
            setBio(dbUser.bio || '');
            setBannerUrl(dbUser.banner_url || '');
            setCustomAvatarUrl(dbUser.custom_avatar_url || '');
        }
    }, [dbUser]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!dbUser) throw new Error("No user");
            const updated = await updateUser(dbUser.id, { 
                name, 
                bio,
                banner_url: bannerUrl,
                custom_avatar_url: customAvatarUrl
            });
            if (!updated) throw new Error("Update failed");
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['db-user', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['user', dbUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['db-user-current', user?.id] });
            toast({ title: "Profile updated successfully" });
        },
        onError: () => {
            toast({ title: "Failed to update profile", variant: "destructive" });
        }
    });

    if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!user) return <div className="p-8 text-center">Please sign in to access settings.</div>;

    return (
        <div className="flex-1 p-6 md:p-8 animate-in-fade max-w-2xl mx-auto w-full">
             <div className="mb-8 border-b border-border pb-4">
                <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Settings</h1>
                <p className="font-mono text-sm text-muted-foreground uppercase">Manage Profile & Preferences</p>
            </div>

            <div className="space-y-8">
                {/* Profile Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold uppercase flex items-center gap-2">
                        <UserIcon className="w-5 h-5" /> Public Profile
                    </h2>

                    <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20 border-2 border-border">
                            <AvatarImage src={customAvatarUrl || user.imageUrl} className="object-cover" />
                            <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm text-muted-foreground">
                            <p>Preview of your profile picture.</p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="customAvatar">Custom Avatar URL</Label>
                        <Input 
                            id="customAvatar" 
                            value={customAvatarUrl} 
                            onChange={(e) => setCustomAvatarUrl(e.target.value)} 
                            placeholder="https://..."
                            className="max-w-md font-mono text-xs"
                        />
                         <p className="text-[10px] text-muted-foreground font-mono uppercase">
                            Overrides your default avatar.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="banner">Profile Banner URL</Label>
                        <Input 
                            id="banner" 
                            value={bannerUrl} 
                            onChange={(e) => setBannerUrl(e.target.value)} 
                            placeholder="https://..."
                            className="max-w-md font-mono text-xs"
                        />
                         <p className="text-[10px] text-muted-foreground font-mono uppercase">
                            Displayed at the top of your public profile.
                        </p>
                        
                        {bannerUrl && (
                            <div className="mt-2 w-full max-w-md h-32 rounded-lg overflow-hidden border border-border bg-muted">
                                <img 
                                    src={bannerUrl} 
                                    alt="Banner Preview" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="max-w-md font-bold"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                            id="bio" 
                            value={bio} 
                            onChange={(e) => setBio(e.target.value)} 
                            placeholder="Tell us about yourself..."
                            className="max-w-md h-32 resize-none"
                        />
                         <p className="text-[10px] text-muted-foreground font-mono uppercase">
                            Visible on your public profile.
                        </p>
                    </div>

                    <Button 
                        onClick={() => updateMutation.mutate()} 
                        disabled={updateMutation.isPending}
                        className="w-full max-w-md uppercase font-bold"
                    >
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
