<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Board extends Model
{
    use HasFactory;

    protected $fillable = [
    'name',
    'description',
    'owner_id',
    ];

    public function members()
    {
        return $this->belongsToMany(User::class, 'board_user')
                ->withPivot('role')
                ->withTimestamps();
    }
    
    public function columns()
    {
        return $this->hasMany(Column::class);
    }

    public function getUserRole()
    {
        if ($this->owner_id === user_id){
            return 'owner';
        }

        $member = $this->members()->where('user_id', $userId)->first();

        return $member?->pivot->role;
    }

    public function canView($userId)
    {
        return $this->owner_id === $userId
        || $this->members()->where('user_id', $userId)->exists();
    }

    public function canEdit($userId)
    {
        if ($this->owner_id === $userId) return true;
        
        $member = $this->members()->where('user_id', $userId)->first();
        
        return $member && $member->pivot->role === 'editor';
    }
}
