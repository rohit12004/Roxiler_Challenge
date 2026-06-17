import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import axiosInstance from '../api/axios';
import { Users, Store, Star, Plus, Search, X, Shield, Info, Lock, MapPin, Mail, FileText, Copy, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Common Navbar Header for Dashboards
const DashboardHeader = ({ title }) => {
  const { user, logout, logoutAll } = useAuth();

  return (
    <header className="border-b border-border bg-card py-4 px-6 md:px-12 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
          S
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-sm font-semibold text-foreground">{user?.name}</span>
          <span className="text-xs text-muted-foreground capitalize font-medium">{user?.role}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={logout} className="font-semibold text-xs border border-border">
            Logout
          </Button>
          <Button variant="outline" size="sm" onClick={logoutAll} className="font-semibold text-xs border border-border text-destructive hover:bg-destructive/10">
            Logout All Devices
          </Button>
        </div>
      </div>
    </header>
  );
};

// 1. User/Customer Home Page (Customer Portal)
export const UserHome = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stores');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Sorting State for Stores
  const [storeSortField, setStoreSortField] = useState('name');
  const [storeSortOrder, setStoreSortOrder] = useState('asc');

  // Load stores list via TanStack Query
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores', search],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/stores', {
        params: { search }
      });
      return res.data.data.stores;
    },
    enabled: activeTab === 'stores'
  });

  // Client-side stores sorting
  const sortedStores = [...stores].sort((a, b) => {
    let aVal = a[storeSortField];
    let bVal = b[storeSortField];
    if (storeSortField === 'overallRating' || storeSortField === 'reviewsCount') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    } else {
      aVal = (aVal || '').toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }
    if (aVal < bVal) return storeSortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return storeSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Rating Modal State
  const [selectedStore, setSelectedStore] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Password Update Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLengthValid, setPwdLengthValid] = useState(false);
  const [pwdUpperValid, setPwdUpperValid] = useState(false);
  const [pwdSpecialValid, setPwdSpecialValid] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    setPwdLengthValid(newPassword.length >= 8 && newPassword.length <= 16);
    setPwdUpperValid(/[A-Z]/.test(newPassword));
    setPwdSpecialValid(/[^a-zA-Z0-9]/.test(newPassword));
  }, [newPassword]);

  // Open rating submission popup
  const handleOpenRatingModal = (store) => {
    setSelectedStore(store);
    setRatingVal(store.userRating || 5);
    setReviewText(store.userReviewText || '');
    setModalError('');
    setModalSuccess('');
    setModalOpen(true);
  };

  // Submit/Modify rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async ({ storeId, rating, reviewText }) => {
      const res = await axiosInstance.post('/api/ratings', {
        storeId,
        rating,
        reviewText
      });
      return res.data;
    },
    onSuccess: () => {
      setModalSuccess('Your rating has been submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      setTimeout(() => {
        setModalOpen(false);
      }, 1500);
    },
    onError: (err) => {
      setModalError(err.response?.data?.message || 'Failed to submit rating.');
    }
  });

  const handleSubmitRating = (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    submitRatingMutation.mutate({
      storeId: selectedStore.id,
      rating: ratingVal,
      reviewText
    });
  };

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const res = await axiosInstance.post('/api/auth/update-password', {
        currentPassword,
        newPassword
      });
      return res.data;
    },
    onSuccess: () => {
      setPwdSuccess('Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => {
      setPwdError(err.response?.data?.message || 'Failed to update password.');
    }
  });

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    if (!pwdLengthValid || !pwdUpperValid || !pwdSpecialValid) {
      setPwdError('New password does not meet the complexity requirements.');
      return;
    }

    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  // Star Rating renderer helper
  const renderStars = (rating, size = "h-4 w-4") => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size} ${
            i <= floor
              ? 'fill-amber-400 text-amber-400'
              : i - 0.5 <= rating
              ? 'fill-amber-400/50 text-amber-400'
              : 'text-muted-foreground'
          }`}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-12">
      <DashboardHeader title="Store Directory" />
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 w-full flex-grow animate-fade-in">
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-2xl p-6 md:p-8 border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome to the Platform</h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Browse registered stores, view overall ratings, and submit or modify your reviews.
            </p>
          </div>
          <div className="px-4 py-2 bg-card rounded-lg border border-border text-sm font-semibold shadow-sm text-foreground">
            Customer Account
          </div>
        </div>

        {/* Tab Controls */}
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border rounded-xl max-w-max overflow-x-auto">
            <button
              onClick={() => setActiveTab('stores')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'stores'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Stores Directory
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'profile'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Profile Details
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'password'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Security Settings
            </button>
          </div>

          {/* TAB 1: STORES DIRECTORY */}
          {activeTab === 'stores' && (
            <div className="space-y-6">
              {/* Search and Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    placeholder="Search stores by name or address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 text-sm h-11 border-border bg-card/50 backdrop-blur-sm focus-visible:ring-primary/20"
                  />
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Sort By:</span>
                  <select
                    value={`${storeSortField}-${storeSortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setStoreSortField(field);
                      setStoreSortOrder(order);
                    }}
                    className="flex h-11 w-44 rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-border shadow-sm text-foreground cursor-pointer"
                  >
                    <option value="name-asc">Store Name (A-Z)</option>
                    <option value="name-desc">Store Name (Z-A)</option>
                    <option value="overallRating-desc">Overall Rating (High-Low)</option>
                    <option value="overallRating-asc">Overall Rating (Low-High)</option>
                    <option value="reviewsCount-desc">Reviews Count (High-Low)</option>
                    <option value="reviewsCount-asc">Reviews Count (Low-High)</option>
                  </select>
                </div>
              </div>

              {/* Stores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedStores.map((s) => (
                  <Card key={s.id} className="border-border hover:border-primary/30 transition duration-300 shadow-sm hover:shadow-md bg-card/60 backdrop-blur-sm flex flex-col justify-between overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <CardTitle className="text-lg font-bold flex items-start gap-2.5">
                        <Store className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-snug">{s.name}</span>
                      </CardTitle>
                      <CardDescription className="flex items-start gap-1.5 mt-2 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{s.address}</span>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="py-4 space-y-4 text-sm flex-grow">
                      {/* Overall Average Rating */}
                      <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-lg border border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground">Overall Rating:</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          {renderStars(s.overallRating)}
                          <span>{s.overallRating > 0 ? `${s.overallRating.toFixed(1)}/5.0` : 'No ratings'}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({s.reviewsCount} reviews)</span>
                        </div>
                      </div>

                      {/* User's Submitted Rating */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Your Rating:</span>
                        {s.userRating > 0 ? (
                          <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              {renderStars(s.userRating, "h-3.5 w-3.5")}
                              <span>{s.userRating} out of 5</span>
                            </div>
                            {s.userReviewText && (
                              <p className="text-xs italic text-muted-foreground font-medium line-clamp-2 bg-muted/20 p-1.5 rounded">
                                "{s.userReviewText}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 text-xs text-muted-foreground font-medium italic">
                            You have not submitted a rating yet.
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 pb-4 border-t border-border/40 bg-muted/10">
                      <Button
                        onClick={() => handleOpenRatingModal(s)}
                        variant={s.userRating > 0 ? "outline" : "default"}
                        className="w-full font-semibold text-xs h-9"
                      >
                        {s.userRating > 0 ? 'Modify Your Rating' : 'Submit A Rating'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

                {sortedStores.length === 0 && (
                  <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/40">
                    <Store className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No stores found matching your search query.</p>
                    <p className="text-xs mt-1">Try searching by a different name or location.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto w-full">
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Your Profile Details</CardTitle>
                  <CardDescription>Verified information linked to your customer session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="font-semibold text-muted-foreground block mb-0.5 text-xs">Account Name</span>
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {user?.name}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="font-semibold text-muted-foreground block mb-0.5 text-xs">Email Address</span>
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user?.email}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="font-semibold text-muted-foreground block mb-0.5 text-xs">Delivery Address</span>
                    <span className="text-foreground font-semibold flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span>{user?.address}</span>
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="font-semibold text-muted-foreground block mb-0.5 text-xs">System Scope</span>
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Normal User (Customer privileges)</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: SECURITY SETTINGS */}
          {activeTab === 'password' && (
            <div className="max-w-md mx-auto w-full">
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Change Password</CardTitle>
                  <CardDescription>Update your system access credentials</CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                  <CardContent className="space-y-4">
                    {pwdError && (
                      <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 font-medium">
                        {pwdError}
                      </div>
                    )}
                    
                    {pwdSuccess && (
                      <div className="rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                        {pwdSuccess}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="curr-pass" className="text-sm font-semibold">Current Password</Label>
                      <Input
                        id="curr-pass"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-pass" className="text-sm font-semibold">New Password</Label>
                      <Input
                        id="new-pass"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      
                      {/* Password rules strength indicators */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 p-3 bg-muted/40 rounded-lg border border-border text-xs">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className={pwdLengthValid ? "text-emerald-500" : "text-muted-foreground"}>
                            {pwdLengthValid ? '✅' : '❌'}
                          </span>
                          <span className={pwdLengthValid ? "text-foreground" : "text-muted-foreground"}>
                            8 to 16 chars
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className={pwdUpperValid ? "text-emerald-500" : "text-muted-foreground"}>
                            {pwdUpperValid ? '✅' : '❌'}
                          </span>
                          <span className={pwdUpperValid ? "text-foreground" : "text-muted-foreground"}>
                            1 Uppercase
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className={pwdSpecialValid ? "text-emerald-500" : "text-muted-foreground"}>
                            {pwdSpecialValid ? '✅' : '❌'}
                          </span>
                          <span className={pwdSpecialValid ? "text-foreground" : "text-muted-foreground"}>
                            1 Special Char
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-pass" className="text-sm font-semibold">Confirm New Password</Label>
                      <Input
                        id="confirm-pass"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      disabled={updatePasswordMutation.isPending || !currentPassword || !pwdLengthValid || !pwdUpperValid || !pwdSpecialValid}
                      className="w-full text-sm font-semibold h-11"
                    >
                      {updatePasswordMutation.isPending ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* RATING SUBMISSION MODAL */}
      {modalOpen && selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md border border-border shadow-2xl bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <span>{selectedStore.userRating > 0 ? 'Edit Your Review' : 'Rate Store'}</span>
                </CardTitle>
                <CardDescription>Share your experience at {selectedStore.name}</CardDescription>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSubmitRating}>
              <div className="p-6 space-y-5">
                {modalError && (
                  <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 font-medium">
                    {modalError}
                  </div>
                )}
                
                {modalSuccess && (
                  <div className="rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                    {modalSuccess}
                  </div>
                )}

                {/* Star selection */}
                <div className="space-y-2 text-center">
                  <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Select Star Rating</span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRatingVal(starVal)}
                        className="p-1.5 hover:scale-110 active:scale-95 transition"
                      >
                        <Star
                          className={`h-8 w-8 transition duration-150 ${
                            starVal <= ratingVal
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-bold block mt-1 text-amber-600 dark:text-amber-400">
                    {ratingVal} Star{ratingVal > 1 ? 's' : ''} - {
                      ratingVal === 5 ? 'Excellent!' :
                      ratingVal === 4 ? 'Very Good' :
                      ratingVal === 3 ? 'Average' :
                      ratingVal === 2 ? 'Fair' : 'Poor'
                    }
                  </span>
                </div>

                {/* Review Text */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="review-text" className="text-sm font-semibold">Written Review (Optional)</Label>
                    <span className={`text-[10px] ${reviewText.length > 400 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {reviewText.length}/400 chars
                    </span>
                  </div>
                  <textarea
                    id="review-text"
                    placeholder="Describe your purchase experience, store service quality, etc..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    maxLength={400}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none border-border"
                  />
                </div>
              </div>
              
              <CardFooter className="border-t border-border/40 py-4 flex gap-3 justify-end bg-muted/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="font-semibold text-xs border border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitRatingMutation.isPending || reviewText.length > 400}
                  className="font-semibold text-xs px-4 h-9"
                >
                  {submitRatingMutation.isPending ? 'Submitting...' : 'Save Review'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// 2. Store Owner Dashboard Portal
export const OwnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('performance');
  const queryClient = useQueryClient();

  // Load store dashboard stats via TanStack Query
  const { data: stats = null, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['storeDashboard'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/store/dashboard');
      return res.data.data;
    }
  });

  const error = queryError ? (queryError.response?.data?.message || 'Failed to load store dashboard.') : '';

  // Sorting State
  const [reviewSortField, setReviewSortField] = useState('reviewerName');
  const [reviewSortOrder, setReviewSortOrder] = useState('asc');

  const handleReviewSort = (field) => {
    if (reviewSortField === field) {
      setReviewSortOrder(reviewSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setReviewSortField(field);
      setReviewSortOrder('asc');
    }
  };

  // Password Update Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLengthValid, setPwdLengthValid] = useState(false);
  const [pwdUpperValid, setPwdUpperValid] = useState(false);
  const [pwdSpecialValid, setPwdSpecialValid] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    setPwdLengthValid(newPassword.length >= 8 && newPassword.length <= 16);
    setPwdUpperValid(/[A-Z]/.test(newPassword));
    setPwdSpecialValid(/[^a-zA-Z0-9]/.test(newPassword));
  }, [newPassword]);

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const res = await axiosInstance.post('/api/auth/update-password', {
        currentPassword,
        newPassword
      });
      return res.data;
    },
    onSuccess: () => {
      setPwdSuccess('Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => {
      setPwdError(err.response?.data?.message || 'Failed to update password.');
    }
  });

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    if (!pwdLengthValid || !pwdUpperValid || !pwdSpecialValid) {
      setPwdError('New password does not meet the complexity requirements.');
      return;
    }

    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const renderStars = (rating, size = "h-4 w-4") => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size} ${
            i <= floor
              ? 'fill-amber-400 text-amber-400'
              : i - 0.5 <= rating
              ? 'fill-amber-400/50 text-amber-400'
              : 'text-muted-foreground'
          }`}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-12">
      <DashboardHeader title="Store Owner Dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 w-full flex-grow animate-fade-in">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 md:p-8 border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Manage Your Store</h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Configure details, monitor ratings performance, and view customer reviews.
            </p>
          </div>
          <div className="px-4 py-2 bg-card rounded-lg border border-border text-sm font-semibold shadow-sm text-emerald-600 dark:text-emerald-400">
            Store Owner
          </div>
        </div>

        {/* Tab Controls */}
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border rounded-xl max-w-max overflow-x-auto">
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'performance'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Performance Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'profile'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Store Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'password'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Security Settings
            </button>
          </div>

          {/* TAB 1: PERFORMANCE DASHBOARD */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground text-sm font-medium">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Loading store analytics...
                </div>
              ) : error ? (
                <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                  {error}
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {/* Rating Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border border-border shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Store Average Rating</CardTitle>
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500/10" />
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-4xl font-black tracking-tight">{stats.averageRating.toFixed(1)} <span className="text-sm font-medium text-muted-foreground">/ 5.0</span></div>
                          <p className="text-xs text-muted-foreground">Overall store rating average</p>
                        </div>
                        <div>
                          {renderStars(stats.averageRating, "h-6 w-6")}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-border shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Total Reviews</CardTitle>
                        <FileText className="h-5 w-5 text-indigo-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold tracking-tight">{stats.totalReviews}</div>
                        <p className="text-xs text-muted-foreground mt-1">Number of customers who rated your store</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Customer Reviews Table */}
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-xl">Customer Reviews & Feedback</CardTitle>
                      <CardDescription>View all customer ratings, reviews, and contact information</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      {(() => {
                        const sortedReviews = [...stats.reviews].sort((a, b) => {
                          let aVal = a[reviewSortField] || '';
                          let bVal = b[reviewSortField] || '';
                          
                          if (reviewSortField === 'rating') {
                            aVal = Number(aVal);
                            bVal = Number(bVal);
                          } else if (reviewSortField === 'createdAt') {
                            aVal = new Date(aVal).getTime();
                            bVal = new Date(bVal).getTime();
                          } else {
                            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                          }
                          
                          if (aVal < bVal) return reviewSortOrder === 'asc' ? -1 : 1;
                          if (aVal > bVal) return reviewSortOrder === 'asc' ? 1 : -1;
                          return 0;
                        });

                        return (
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-border text-muted-foreground font-semibold select-none">
                                <th onClick={() => handleReviewSort('reviewerName')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                                  Customer Name {reviewSortField === 'reviewerName' ? (reviewSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                </th>
                                <th onClick={() => handleReviewSort('reviewerEmail')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                                  Email {reviewSortField === 'reviewerEmail' ? (reviewSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                </th>
                                <th onClick={() => handleReviewSort('reviewerAddress')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                                  Address {reviewSortField === 'reviewerAddress' ? (reviewSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                </th>
                                <th onClick={() => handleReviewSort('rating')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                                  Rating {reviewSortField === 'rating' ? (reviewSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                </th>
                                <th className="pb-3 pr-4">Review Comment</th>
                                <th onClick={() => handleReviewSort('createdAt')} className="pb-3 text-right cursor-pointer hover:text-foreground transition duration-150">
                                  Date {reviewSortField === 'createdAt' ? (reviewSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedReviews.map((r) => (
                                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/10">
                                  <td className="py-3 pr-4 font-semibold text-foreground">{r.reviewerName}</td>
                                  <td className="py-3 pr-4 text-muted-foreground font-medium">{r.reviewerEmail}</td>
                                  <td className="py-3 pr-4 max-w-xs truncate text-muted-foreground">{r.reviewerAddress}</td>
                                  <td className="py-3 pr-4">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-bold text-xs text-foreground">{r.rating} / 5</span>
                                      {renderStars(r.rating, "h-3.5 w-3.5")}
                                    </div>
                                  </td>
                                  <td className="py-3 pr-4 max-w-sm">
                                    {r.reviewText ? (
                                      <p className="text-xs italic text-muted-foreground bg-muted/20 p-2 rounded leading-relaxed border-l-2 border-primary/50">
                                        "{r.reviewText}"
                                      </p>
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic font-medium">No written comment.</span>
                                    )}
                                  </td>
                                  <td className="py-3 text-right text-xs text-muted-foreground font-medium">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                              {sortedReviews.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="py-8 text-center text-muted-foreground italic">
                                    No customer ratings have been submitted for your store yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STORE PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto w-full">
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Store Profile Details</CardTitle>
                  <CardDescription>Verified store information listed in public directories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="font-semibold text-muted-foreground block mb-0.5 text-xs">Store Name</span>
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      {user?.name}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="font-semibold text-muted-foreground block mb-0.5 text-xs">Owner Email Address</span>
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user?.email}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="font-semibold text-muted-foreground block mb-0.5 text-xs">Store/Business Address</span>
                    <span className="text-foreground font-semibold flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span>{user?.address}</span>
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="font-semibold text-muted-foreground block mb-0.5 text-xs">System Scope</span>
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Store Owner (Business privileges)</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: SECURITY SETTINGS */}
          {activeTab === 'password' && (
            <div className="max-w-md mx-auto w-full">
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Change Password</CardTitle>
                  <CardDescription>Update your store owner system access credentials</CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                  <CardContent className="space-y-4">
                    {pwdError && (
                      <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 font-medium">
                        {pwdError}
                      </div>
                    )}
                    
                    {pwdSuccess && (
                      <div className="rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                        {pwdSuccess}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="curr-pass" className="text-sm font-semibold">Current Password</Label>
                      <Input
                        id="curr-pass"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-pass" className="text-sm font-semibold">New Password</Label>
                      <Input
                        id="new-pass"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      
                      {/* Password rules strength indicators */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 p-3 bg-muted/40 rounded-lg border border-border text-xs">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className={pwdLengthValid ? "text-emerald-500" : "text-muted-foreground"}>
                            {pwdLengthValid ? '✅' : '❌'}
                          </span>
                          <span className={pwdLengthValid ? "text-foreground" : "text-muted-foreground"}>
                            8 to 16 chars
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className={pwdUpperValid ? "text-emerald-500" : "text-muted-foreground"}>
                            {pwdUpperValid ? '✅' : '❌'}
                          </span>
                          <span className={pwdUpperValid ? "text-foreground" : "text-muted-foreground"}>
                            1 Uppercase
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className={pwdSpecialValid ? "text-emerald-500" : "text-muted-foreground"}>
                            {pwdSpecialValid ? '✅' : '❌'}
                          </span>
                          <span className={pwdSpecialValid ? "text-foreground" : "text-muted-foreground"}>
                            1 Special Char
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-pass" className="text-sm font-semibold">Confirm New Password</Label>
                      <Input
                        id="confirm-pass"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      disabled={updatePasswordMutation.isPending || !currentPassword || !pwdLengthValid || !pwdUpperValid || !pwdSpecialValid}
                      className="w-full text-sm font-semibold h-11"
                    >
                      {updatePasswordMutation.isPending ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// 3. Admin Dashboard
export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Load stats via TanStack Query
  const { data: stats = { totalUsers: 0, totalStores: 0, totalRatings: 0 } } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/admin/stats');
      return res.data.data;
    }
  });

  // Search & Filter
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchStore, setSearchStore] = useState('');

  // Load users list via TanStack Query
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers', searchUser, roleFilter],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/admin/users', {
        params: { search: searchUser, role: roleFilter }
      });
      return res.data.data.users;
    },
    enabled: activeTab === 'users' || activeTab === 'overview'
  });

  // Load stores list via TanStack Query
  const { data: stores = [] } = useQuery({
    queryKey: ['adminStores', searchStore],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/admin/stores', {
        params: { search: searchStore }
      });
      return res.data.data.stores;
    },
    enabled: activeTab === 'stores' || activeTab === 'overview'
  });

  // Sorting State
  const [userSortField, setUserSortField] = useState('name');
  const [userSortOrder, setUserSortOrder] = useState('asc');
  const [storeSortField, setStoreSortField] = useState('name');
  const [storeSortOrder, setStoreSortOrder] = useState('asc');

  const handleUserSort = (field) => {
    if (userSortField === field) {
      setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortOrder('asc');
    }
  };

  const handleStoreSort = (field) => {
    if (storeSortField === field) {
      setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStoreSortField(field);
      setStoreSortOrder('asc');
    }
  };

  // Modals & Details
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Reset Password State
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey('');
    }, 2000);
  };

  // Password rules validation
  const [pwdLengthValid, setPwdLengthValid] = useState(false);
  const [pwdUpperValid, setPwdUpperValid] = useState(false);
  const [pwdSpecialValid, setPwdSpecialValid] = useState(false);

  useEffect(() => {
    if (formPassword) {
      setPwdLengthValid(formPassword.length >= 8 && formPassword.length <= 16);
      setPwdUpperValid(/[A-Z]/.test(formPassword));
      setPwdSpecialValid(/[^a-zA-Z0-9]/.test(formPassword));
    } else {
      setPwdLengthValid(false);
      setPwdUpperValid(false);
      setPwdSpecialValid(false);
    }
  }, [formPassword]);

  const handleOpenResetConfirm = (user) => {
    setResetTargetUser(user);
    setResetPasswordError('');
    setResetPasswordSuccess(null);
    setResetConfirmOpen(true);
  };

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await axiosInstance.post('/api/admin/users/reset-password', {
        userId
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResetPasswordSuccess({
        password: data.data.temporaryPassword
      });
      // Invalidate query caches
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStores'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (err) => {
      console.error('Failed to reset password:', err);
      setResetPasswordError(err.response?.data?.message || 'Failed to reset password.');
    }
  });

  const handleResetPasswordSubmit = () => {
    setResetPasswordError('');
    resetPasswordMutation.mutate(resetTargetUser.id);
  };

  // Show detailed profile modal
  const handleViewDetails = async (userId) => {
    setDetailsLoading(true);
    setSelectedUser(null);
    setModalOpen(true);
    try {
      const res = await axiosInstance.get(`/api/admin/users/${userId}`);
      setSelectedUser(res.data.data.user);
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle new account creation mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      const res = await axiosInstance.post('/api/admin/users', userData);
      return res.data;
    },
    onSuccess: (data) => {
      const createdUser = data.data.user;
      if (createdUser.temporaryPassword) {
        setCreatedCredentials({
          email: createdUser.email,
          password: createdUser.temporaryPassword,
          role: createdUser.role
        });
      }

      setFormSuccess(`Account registered successfully as: ${formRole === 'owner' ? 'Store' : formRole}!`);
      // Reset form
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormAddress('');
      setFormRole('user');

      // Refresh data via query invalidation
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStores'] });
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create account.');
    }
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setCreatedCredentials(null);

    if (formName.length < 20 || formName.length > 60) {
      setFormError('Name must be between 20 and 60 characters long.');
      return;
    }

    if (formPassword && (!pwdLengthValid || !pwdUpperValid || !pwdSpecialValid)) {
      setFormError('Password does not meet all complexity requirements.');
      return;
    }

    if (formAddress.length > 400) {
      setFormError('Address must not exceed 400 characters.');
      return;
    }

    addUserMutation.mutate({
      name: formName,
      email: formEmail,
      password: formPassword || undefined,
      address: formAddress,
      role: formRole
    });
  };

  // Star Rating renderer helper
  const renderStars = (rating) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i <= floor
              ? 'fill-amber-400 text-amber-400'
              : i - 0.5 <= rating
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-muted-foreground'
            }`}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-12">
      <DashboardHeader title="Admin Control Center" />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 w-full flex-grow animate-fade-in">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-6 md:p-8 border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Administration</h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Register store owners, users, and admins. Oversee profiles, ratings, and stats.
            </p>
          </div>
          <div className="px-4 py-2 bg-card rounded-lg border border-border text-sm font-semibold shadow-sm text-amber-600 dark:text-amber-400">
            Global Administrator
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border border-border shadow-sm bg-card/50 backdrop-blur-sm hover:scale-[1.01] transition duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Users</CardTitle>
              <Users className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Normal & admin accounts</p>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm bg-card/50 backdrop-blur-sm hover:scale-[1.01] transition duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Stores</CardTitle>
              <Store className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats.totalStores}</div>
              <p className="text-xs text-muted-foreground mt-1">Store Owner accounts</p>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm bg-card/50 backdrop-blur-sm hover:scale-[1.01] transition duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Submitted Ratings</CardTitle>
              <Star className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats.totalRatings}</div>
              <p className="text-xs text-muted-foreground mt-1">Customer reviews submitted</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border rounded-xl max-w-max overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'overview'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              System Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'users'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Manage Users
            </button>
            <button
              onClick={() => setActiveTab('stores')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'stores'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Manage Stores
            </button>
            <button
              onClick={() => setActiveTab('add_account')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition duration-200 ${
                activeTab === 'add_account'
                  ? 'bg-background text-primary shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Users</CardTitle>
                  <CardDescription>Recently registered customer and admin accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {users.slice(0, 3).map((u) => (
                    <div key={u.id} className="flex justify-between items-center p-3 bg-muted/30 border border-border/50 rounded-lg text-sm">
                      <div className="space-y-0.5">
                        <span className="font-semibold">{u.name}</span>
                        <span className="block text-xs text-muted-foreground">{u.email}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-xs text-muted-foreground">No accounts found.</p>}
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('users')} className="w-full text-xs font-semibold">
                    View All Users
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Top Performing Stores</CardTitle>
                  <CardDescription>Stores listed by highest ratings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...stores]
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 3)
                    .map((s) => (
                      <div key={s.id} className="flex justify-between items-center p-3 bg-muted/30 border border-border/50 rounded-lg text-sm">
                        <div className="space-y-0.5">
                          <span className="font-semibold">{s.name}</span>
                          <span className="block text-xs text-muted-foreground">{s.email}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-bold text-foreground">{Number(s.rating).toFixed(1)} / 5.0</span>
                          {renderStars(s.rating)}
                        </div>
                      </div>
                    ))}
                  {stores.length === 0 && <p className="text-xs text-muted-foreground">No stores found.</p>}
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('stores')} className="w-full text-xs font-semibold">
                    View All Stores
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: MANAGE USERS */}
          {activeTab === 'users' && (
            <Card className="border-border">
              <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl">User Directory</CardTitle>
                  <CardDescription>Audit and search user accounts registered on the system</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name, email..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="pl-8 text-sm"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="flex h-10 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-border"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Normal Users</option>
                    <option value="admin">Administrators</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {(() => {
                  const sortedUsers = [...users].sort((a, b) => {
                    let aVal = a[userSortField] || '';
                    let bVal = b[userSortField] || '';
                    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                    if (aVal < bVal) return userSortOrder === 'asc' ? -1 : 1;
                    if (aVal > bVal) return userSortOrder === 'asc' ? 1 : -1;
                    return 0;
                  });

                  return (
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold select-none">
                          <th onClick={() => handleUserSort('name')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                            Name {userSortField === 'name' ? (userSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </th>
                          <th onClick={() => handleUserSort('email')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                            Email {userSortField === 'email' ? (userSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </th>
                          <th onClick={() => handleUserSort('address')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                            Address {userSortField === 'address' ? (userSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </th>
                          <th onClick={() => handleUserSort('role')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                            Role {userSortField === 'role' ? (userSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUsers.map((u) => (
                          <tr key={u.id} className="border-b border-border/50 hover:bg-muted/10">
                            <td className="py-3 pr-4 font-semibold text-foreground">{u.name}</td>
                            <td className="py-3 pr-4 text-muted-foreground font-medium">{u.email}</td>
                            <td className="py-3 pr-4 max-w-xs truncate text-muted-foreground">{u.address}</td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(u.id)} className="text-xs font-semibold h-8">
                                  View Details
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleOpenResetConfirm(u)} className="text-xs font-semibold h-8 text-destructive border-destructive/20 hover:bg-destructive/10">
                                  Reset Password
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {sortedUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                              No users matching search filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* TAB 3: MANAGE STORES */}
          {activeTab === 'stores' && (
            <Card className="border-border">
              <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl">Store Directory</CardTitle>
                  <CardDescription>Analyze ratings performance and details of stores</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, address..."
                    value={searchStore}
                    onChange={(e) => setSearchStore(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {(() => {
                  const sortedStores = [...stores].sort((a, b) => {
                    let aVal = a[storeSortField] || '';
                    let bVal = b[storeSortField] || '';
                    if (storeSortField === 'rating') {
                      aVal = Number(aVal);
                      bVal = Number(bVal);
                    } else {
                      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                    }
                    if (aVal < bVal) return storeSortOrder === 'asc' ? -1 : 1;
                    if (aVal > bVal) return storeSortOrder === 'asc' ? 1 : -1;
                    return 0;
                  });

                  return (
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold select-none">
                          <th onClick={() => handleStoreSort('name')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                            Store Name {storeSortField === 'name' ? (storeSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </th>
                          <th onClick={() => handleStoreSort('email')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                            Email {storeSortField === 'email' ? (storeSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </th>
                          <th onClick={() => handleStoreSort('address')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                            Address {storeSortField === 'address' ? (storeSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </th>
                          <th onClick={() => handleStoreSort('rating')} className="pb-3 pr-4 cursor-pointer hover:text-foreground transition duration-150">
                            Avg Rating {storeSortField === 'rating' ? (storeSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                          </th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedStores.map((s) => (
                          <tr key={s.id} className="border-b border-border/50 hover:bg-muted/10">
                            <td className="py-3 pr-4 font-semibold text-foreground">{s.name}</td>
                            <td className="py-3 pr-4 text-muted-foreground font-medium">{s.email}</td>
                            <td className="py-3 pr-4 max-w-xs truncate text-muted-foreground">{s.address}</td>
                            <td className="py-3 pr-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-xs text-foreground">{Number(s.rating).toFixed(1)} / 5.0 ({s.reviews_count} reviews)</span>
                                {renderStars(s.rating)}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(s.id)} className="text-xs font-semibold h-8">
                                  View Reviews
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleOpenResetConfirm(s)} className="text-xs font-semibold h-8 text-destructive border-destructive/20 hover:bg-destructive/10">
                                  Reset Password
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {sortedStores.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                              No stores matching search filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* TAB 4: CREATE ACCOUNT */}
          {activeTab === 'add_account' && (
            <div className="max-w-xl mx-auto w-full">
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Create Account</CardTitle>
                  <CardDescription>Register a new Store, Normal User, or Admin Account</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddUser}>
                  <CardContent className="space-y-4">
                    {formError && (
                      <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 font-medium">
                        {formError}
                      </div>
                    )}

                    {formSuccess && (
                      <div className="rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                        {formSuccess}
                      </div>
                    )}

                    {createdCredentials && (
                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 space-y-3 animate-fade-in text-sm">
                        <h3 className="font-bold text-foreground flex items-center gap-1.5">
                          <Shield className="h-4.5 w-4.5 text-primary" />
                          Temporary Credentials Generated
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Please copy these credentials now. For security, this temporary password will not be shown again.
                        </p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center p-2.5 bg-muted/60 border border-border rounded-lg">
                            <span className="text-muted-foreground font-semibold">Email:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold select-all text-foreground">{createdCredentials.email}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(createdCredentials.email, 'created-email')}
                                className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-semibold border border-border bg-background hover:bg-muted transition-all duration-200"
                              >
                                {copiedKey === 'created-email' ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-emerald-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-muted/60 border border-border rounded-lg">
                            <span className="text-muted-foreground font-semibold">Temporary Password:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold select-all text-foreground">{createdCredentials.password}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(createdCredentials.password, 'created-pass')}
                                className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-semibold border border-border bg-background hover:bg-muted transition-all duration-200"
                              >
                                {copiedKey === 'created-pass' ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-emerald-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setCreatedCredentials(null)}
                            className="text-[10px] font-semibold h-7 border border-border"
                          >
                            Dismiss Credentials
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="reg-role" className="text-sm font-semibold">Account Role</Label>
                      <select
                        id="reg-role"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-border"
                      >
                        <option value="user">Normal User (Customer)</option>
                        <option value="owner">Store (Store Owner)</option>
                        <option value="admin">System Administrator</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="reg-name" className="text-sm font-semibold">
                          {formRole === 'owner' ? 'Store Name' : 'Full Name'}
                        </Label>
                        <span className={`text-xs font-semibold ${formName.length >= 20 && formName.length <= 60 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          {formName.length}/20 chars min
                        </span>
                      </div>
                      <Input
                        id="reg-name"
                        placeholder={formRole === 'owner' ? 'Roxiler Supermarket Hub' : 'Rohit Kalvankar (Developer Account)'}
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                      />
                      {formName && formName.length < 20 && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                          ⚠️ Name is too short. Must be at least 20 characters.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email" className="text-sm font-semibold">Email Address</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="email@example.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="reg-password" className="text-sm font-semibold">Password (Optional)</Label>
                        <span className="text-xs text-muted-foreground italic font-medium">Leave blank to auto-generate</span>
                      </div>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                      />

                      {/* Password rules strength indicators */}
                      {formPassword && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 p-3 bg-muted/40 rounded-lg border border-border text-xs">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className={pwdLengthValid ? "text-emerald-500" : "text-muted-foreground"}>
                              {pwdLengthValid ? '✅' : '❌'}
                            </span>
                            <span className={pwdLengthValid ? "text-foreground" : "text-muted-foreground"}>
                              8 to 16 chars
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className={pwdUpperValid ? "text-emerald-500" : "text-muted-foreground"}>
                              {pwdUpperValid ? '✅' : '❌'}
                            </span>
                            <span className={pwdUpperValid ? "text-foreground" : "text-muted-foreground"}>
                              1 Uppercase
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className={pwdSpecialValid ? "text-emerald-500" : "text-muted-foreground"}>
                              {pwdSpecialValid ? '✅' : '❌'}
                            </span>
                            <span className={pwdSpecialValid ? "text-foreground" : "text-muted-foreground"}>
                              1 Special Char
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="reg-address" className="text-sm font-semibold">Address</Label>
                        <span className="text-xs text-muted-foreground">{formAddress.length}/400 max</span>
                      </div>
                      <textarea
                        id="reg-address"
                        placeholder="123 Street Road, District Area, Code"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        required
                        rows={3}
                        maxLength={400}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none border-border"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      disabled={addUserMutation.isPending || formName.length < 20 || (formPassword && (!pwdLengthValid || !pwdUpperValid || !pwdSpecialValid))}
                      className="w-full text-sm font-semibold h-11"
                    >
                      {addUserMutation.isPending ? 'Registering Account...' : 'Register Account'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* DETAIL VIEW MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-2xl border border-border shadow-2xl bg-card max-h-[85vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <span>Profile Audit</span>
                  {selectedUser && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${selectedUser.role === 'admin'
                        ? 'bg-amber-500/10 text-amber-600'
                        : selectedUser.role === 'owner'
                          ? 'bg-indigo-500/10 text-indigo-600'
                          : 'bg-primary/10 text-primary'
                      }`}>
                      {selectedUser.role === 'owner' ? 'Store Owner' : selectedUser.role}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Global database metadata lookup</CardDescription>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <div className="overflow-y-auto flex-grow p-6 space-y-6">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground text-sm font-medium">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Fetching details...
                </div>
              ) : selectedUser ? (
                <div className="space-y-6">
                  {/* Basic Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">Full Name / Title</span>
                      <span className="text-foreground font-semibold flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {selectedUser.name}
                      </span>
                    </div>
                    <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">Email Address</span>
                      <span className="text-foreground font-semibold flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {selectedUser.email}
                      </span>
                    </div>
                    <div className="p-3 bg-muted/30 border border-border/50 rounded-lg sm:col-span-2">
                      <span className="text-xs font-semibold text-muted-foreground block mb-0.5">Registered Address</span>
                      <span className="text-foreground font-semibold flex items-start gap-1.5">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>{selectedUser.address}</span>
                      </span>
                    </div>
                  </div>

                  {/* Rating details for Store Owners */}
                  {selectedUser.role === 'owner' && (
                    <div className="border-t border-border/50 pt-4 space-y-4">
                      <div className="flex justify-between items-center bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-foreground">Rating Summary</span>
                          <span className="block text-xs text-muted-foreground">Calculated across submitted customer feedback</span>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-xl font-black text-foreground">{Number(selectedUser.averageRating).toFixed(1)} / 5.0</span>
                          {renderStars(selectedUser.averageRating)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-destructive font-medium">
                  Failed to load metadata.
                </div>
              )}
            </div>

            <CardHeader className="border-t border-border/50 py-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="font-semibold text-xs border border-border">
                Close Audit
              </Button>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {resetConfirmOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md border border-border shadow-2xl bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-destructive flex items-center gap-1.5">
                  <Shield className="h-5 w-5" />
                  Confirm Password Reset
                </CardTitle>
                <CardDescription>Revoke access and regenerate temporary credentials</CardDescription>
              </div>
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <div className="p-6 space-y-4">
              {resetPasswordError && (
                <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 font-medium">
                  {resetPasswordError}
                </div>
              )}

              {resetPasswordSuccess ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium flex items-start gap-2">
                    <span>✅</span>
                    <div>
                      <p className="font-bold text-xs">Password Reset Successful!</p>
                      <p className="text-[10px] mt-0.5">Active sessions for this user have been terminated.</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Please copy the new temporary password. For security, it will not be displayed again.
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2.5 bg-muted/60 border border-border rounded-lg">
                      <span className="text-muted-foreground font-semibold">User:</span>
                      <span className="font-bold text-foreground">{resetTargetUser.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-muted/60 border border-border rounded-lg">
                      <span className="text-muted-foreground font-semibold">Email:</span>
                      <span className="font-mono font-bold select-all text-foreground">{resetTargetUser.email}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-muted/60 border border-border rounded-lg">
                      <span className="text-muted-foreground font-semibold">New Password:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold select-all text-foreground bg-primary/5 px-1 rounded">{resetPasswordSuccess.password}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(resetPasswordSuccess.password, 'reset-pass')}
                          className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-semibold border border-border bg-background hover:bg-muted transition-all duration-200"
                        >
                          {copiedKey === 'reset-pass' ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="text-foreground">
                    Are you sure you want to reset the password for <span className="font-bold">{resetTargetUser.name}</span> (<span className="font-semibold text-muted-foreground">{resetTargetUser.email}</span>)?
                  </p>
                  <p className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
                    ⚠️ This action will immediately invalidate all active login sessions and generate a new temporary password.
                  </p>
                </div>
              )}
            </div>
            <CardFooter className="border-t border-border/40 py-4 flex gap-3 justify-end bg-muted/10">
              {resetPasswordSuccess ? (
                <Button
                  type="button"
                  onClick={() => {
                    setResetConfirmOpen(false);
                    setResetPasswordSuccess(null);
                    setResetTargetUser(null);
                  }}
                  className="font-semibold text-xs px-4 h-9"
                >
                  Close
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setResetConfirmOpen(false)}
                    className="font-semibold text-xs border border-border"
                    disabled={resetPasswordMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResetPasswordSubmit}
                    disabled={resetPasswordMutation.isPending}
                    className="font-semibold text-xs px-4 h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Yes, Reset Password'}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};
