/**
 * Centralized Validation Service
 * Provides validation functions for all backend features
 */

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * Validate video duration (must be 2-5 minutes)
 */
export function validateVideoDuration(durationSeconds: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (durationSeconds < 120) {
        errors.push({
            field: 'duration_seconds',
            message: 'Video duration must be at least 2 minutes (120 seconds)'
        });
    }

    if (durationSeconds > 300) {
        errors.push({
            field: 'duration_seconds',
            message: 'Video duration cannot exceed 5 minutes (300 seconds)'
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate video URL format and security
 */
export function validateVideoUrl(url: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if URL is provided
    if (!url || url.trim() === '') {
        errors.push({
            field: 'video_url',
            message: 'Video URL is required'
        });
        return { isValid: false, errors };
    }

    // Check HTTPS protocol
    if (!url.startsWith('https://')) {
        errors.push({
            field: 'video_url',
            message: 'Video URL must use HTTPS protocol for security'
        });
    }

    // Validate URL format
    try {
        const urlObj = new URL(url);

        // Check for common video platforms (optional whitelist)
        const allowedDomains = [
            'youtube.com',
            'youtu.be',
            'vimeo.com',
            'dailymotion.com',
            'wistia.com',
            'cloudinary.com',
            'amazonaws.com', // S3
            'supabase.co' // Supabase storage
        ];

        const hostname = urlObj.hostname.toLowerCase();
        const isAllowedDomain = allowedDomains.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );

        if (!isAllowedDomain) {
            errors.push({
                field: 'video_url',
                message: `Video URL domain not recognized. Allowed platforms: ${allowedDomains.join(', ')}`
            });
        }
    } catch (e) {
        errors.push({
            field: 'video_url',
            message: 'Invalid URL format'
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate thumbnail URL (optional, but must be HTTPS if provided)
 */
export function validateThumbnailUrl(url?: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Thumbnail is optional
    if (!url || url.trim() === '') {
        return { isValid: true, errors: [] };
    }

    // If provided, must be HTTPS
    if (!url.startsWith('https://')) {
        errors.push({
            field: 'thumbnail_url',
            message: 'Thumbnail URL must use HTTPS protocol'
        });
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        errors.push({
            field: 'thumbnail_url',
            message: 'Invalid thumbnail URL format'
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate video title
 */
export function validateVideoTitle(title: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!title || title.trim() === '') {
        errors.push({
            field: 'title',
            message: 'Video title is required'
        });
        return { isValid: false, errors };
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle.length < 5) {
        errors.push({
            field: 'title',
            message: 'Video title must be at least 5 characters'
        });
    }

    if (trimmedTitle.length > 200) {
        errors.push({
            field: 'title',
            message: 'Video title cannot exceed 200 characters'
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate video description
 */
export function validateVideoDescription(description: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!description || description.trim() === '') {
        errors.push({
            field: 'description',
            message: 'Video description is required'
        });
        return { isValid: false, errors };
    }

    const trimmedDescription = description.trim();

    if (trimmedDescription.length < 20) {
        errors.push({
            field: 'description',
            message: 'Video description must be at least 20 characters'
        });
    }

    if (trimmedDescription.length > 2000) {
        errors.push({
            field: 'description',
            message: 'Video description cannot exceed 2000 characters'
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate quiz questions (must have 1-3 questions)
 */
export function validateQuizQuestions(
    questions: Array<{
        question: string;
        options: string[];
        correct_answer: number;
    }>
): ValidationResult {
    const errors: ValidationError[] = [];

    // Check count
    if (questions.length < 1) {
        errors.push({
            field: 'quiz_questions',
            message: 'At least 1 quiz question is required'
        });
    }

    if (questions.length > 3) {
        errors.push({
            field: 'quiz_questions',
            message: 'Maximum 3 quiz questions allowed per video'
        });
    }

    // Validate each question
    questions.forEach((q, index) => {
        // Validate question text
        if (!q.question || q.question.trim() === '') {
            errors.push({
                field: `quiz_questions[${index}].question`,
                message: `Question ${index + 1}: Question text is required`
            });
        } else if (q.question.trim().length < 10) {
            errors.push({
                field: `quiz_questions[${index}].question`,
                message: `Question ${index + 1}: Question must be at least 10 characters`
            });
        }

        // Validate options (must have exactly 4)
        if (!Array.isArray(q.options)) {
            errors.push({
                field: `quiz_questions[${index}].options`,
                message: `Question ${index + 1}: Options must be an array`
            });
        } else if (q.options.length !== 4) {
            errors.push({
                field: `quiz_questions[${index}].options`,
                message: `Question ${index + 1}: Must have exactly 4 answer options`
            });
        } else {
            // Check each option is not empty
            q.options.forEach((option, optIndex) => {
                if (!option || option.trim() === '') {
                    errors.push({
                        field: `quiz_questions[${index}].options[${optIndex}]`,
                        message: `Question ${index + 1}, Option ${optIndex + 1}: Cannot be empty`
                    });
                }
            });
        }

        // Validate correct_answer (must be 0-3)
        if (typeof q.correct_answer !== 'number') {
            errors.push({
                field: `quiz_questions[${index}].correct_answer`,
                message: `Question ${index + 1}: correct_answer must be a number`
            });
        } else if (q.correct_answer < 0 || q.correct_answer > 3) {
            errors.push({
                field: `quiz_questions[${index}].correct_answer`,
                message: `Question ${index + 1}: correct_answer must be between 0 and 3`
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate quiz submission answers
 */
export function validateQuizAnswers(
    answers: number[],
    questionCount: number
): ValidationResult {
    const errors: ValidationError[] = [];

    if (!Array.isArray(answers)) {
        errors.push({
            field: 'answers',
            message: 'Quiz answers must be an array'
        });
        return { isValid: false, errors };
    }

    if (answers.length !== questionCount) {
        errors.push({
            field: 'answers',
            message: `Must provide exactly ${questionCount} answers (one for each question)`
        });
    }

    // Validate each answer is a valid index (0-3)
    answers.forEach((answer, index) => {
        if (typeof answer !== 'number') {
            errors.push({
                field: `answers[${index}]`,
                message: `Answer ${index + 1}: Must be a number`
            });
        } else if (answer < 0 || answer > 3) {
            errors.push({
                field: `answers[${index}]`,
                message: `Answer ${index + 1}: Must be between 0 and 3`
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize text input (prevent XSS)
 */
export function sanitizeText(text: string): string {
    return text
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
    const allErrors = results.flatMap(r => r.errors);
    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
    return errors.map(e => `${e.field}: ${e.message}`).join('\n');
}
