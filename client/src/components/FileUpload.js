import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { filesAPI, jobsAPI } from '../services/api';

function FileUpload({ onJobCreated }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) {
      setError('No files accepted');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Create a new job first
      const jobResponse = await jobsAPI.create({
        job_number: `JOB-${Date.now()}`,
        customer_name: 'Unnamed Customer',
        description: 'Job created from file upload',
      });

      const newJob = jobResponse.data;

      // Upload files to the job
      let uploadedCount = 0;
      for (const file of acceptedFiles) {
        await filesAPI.upload(newJob.id, file);
        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / acceptedFiles.length) * 100));
      }

      onJobCreated(newJob);
      setUploading(false);
      setUploadProgress(0);
    } catch (err) {
      setError(`Upload failed: ${err.response?.data?.error || err.message}`);
      setUploading(false);
      console.error(err);
    }
  }, [onJobCreated]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  return (
    <div className="file-upload">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>
            <p>Uploading files...</p>
            <p className="upload-progress">{uploadProgress}%</p>
          </div>
        ) : isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <div>
            <p>📁 Drag and drop files here</p>
            <p>or click to select files</p>
            <p className="file-types">
              Supported: PDF, images, text files, CSV, Excel
            </p>
          </div>
        )}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default FileUpload;
