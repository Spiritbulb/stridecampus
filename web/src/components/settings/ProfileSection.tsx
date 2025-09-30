'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProfileForm {
  full_name: string;
  username: string;
  bio: string;
  school_name: string;
}

interface ProfileSectionProps {
  profileForm: ProfileForm;
  setProfileForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export function ProfileSection({ profileForm, setProfileForm, onSubmit, loading }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your public profile information that other users can see.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profileForm.username}
                onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Your username"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileForm.bio}
              onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="school_name">School/University</Label>
            <Input
              id="school_name"
              value={profileForm.school_name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, school_name: e.target.value }))}
              placeholder="Your school or university"
            />
          </div>

          <Button type="submit" disabled={loading} className="bg-[#f23b36] hover:bg-[#e03530]">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}



