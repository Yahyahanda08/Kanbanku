<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'priority',
        'due_date',
        'position',
        'column_id',
        'assignee_to',   // ← field di DB adalah assignee_id tapi kita pakai alias ini
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
        ];
    }

    public function column()
    {
        return $this->belongsTo(Column::class);
    }

    // ← Relasi ke user lewat field assigned_to
    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->latest();
    }
}