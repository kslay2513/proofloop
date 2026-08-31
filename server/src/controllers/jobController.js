const pool = require('../db/connection');

// Get all jobs for a user
const getJobs = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await pool.query(
      `SELECT j.id, j.job_number, j.customer_name, j.description, j.status, 
              j.created_at, j.updated_at,
              COUNT(DISTINCT e.id) as event_count,
              COUNT(DISTINCT f.id) as file_count
       FROM jobs j
       LEFT JOIN job_events e ON j.id = e.job_id
       LEFT JOIN job_files f ON j.id = f.job_id
       WHERE j.user_id = $1
       GROUP BY j.id
       ORDER BY j.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

// Get single job
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.user;

    const result = await pool.query(
      `SELECT j.* FROM jobs j 
       WHERE j.id = $1 AND j.user_id = $2`,
      [jobId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

// Create job
const createJob = async (req, res) => {
  try {
    const { userId } = req.user;
    const { job_number, customer_name, description, status } = req.body;

    const result = await pool.query(
      `INSERT INTO jobs (user_id, job_number, customer_name, description, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, job_number, customer_name || '', description || '', status || 'open']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

// Update job
const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.user;
    const { job_number, customer_name, description, status } = req.body;

    const result = await pool.query(
      `UPDATE jobs 
       SET job_number = COALESCE($1, job_number),
           customer_name = COALESCE($2, customer_name),
           description = COALESCE($3, description),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [job_number, customer_name, description, status, jobId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

// Delete job
const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.user;

    const result = await pool.query(
      'DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id',
      [jobId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

// Get job timeline
const getJobTimeline = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.user;

    // Verify job belongs to user
    const jobCheck = await pool.query(
      'SELECT id FROM jobs WHERE id = $1 AND user_id = $2',
      [jobId, userId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get all events and files, sorted chronologically
    const result = await pool.query(
      `SELECT 
        'event' as type,
        e.id,
        e.event_type as title,
        e.event_date as date,
        e.person_name,
        e.description,
        e.amount,
        NULL as file_name,
        NULL as file_path,
        NULL as file_type
       FROM job_events e
       WHERE e.job_id = $1
       UNION ALL
       SELECT 
        'file' as type,
        f.id,
        f.file_name as title,
        f.uploaded_at as date,
        NULL as person_name,
        NULL as description,
        NULL as amount,
        f.file_name,
        f.file_path,
        f.file_type
       FROM job_files f
       WHERE f.job_id = $1
       ORDER BY date ASC`,
      [jobId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobTimeline,
};
