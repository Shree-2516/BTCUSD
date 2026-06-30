import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reportService } from '../../../api/services/report';
import toast from 'react-hot-toast';

export const useReportAnalytics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReportData = async (reportId) => {
      try {
        setLoading(true);
        const data = await reportService.getReportDetails(reportId);
        setReport(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReportData(id);
    } else {
      const fetchLatest = async () => {
        try {
          const reports = await reportService.getReports();
          if (reports && reports.length > 0) {
            setSearchParams({ id: reports[0].id }, { replace: true });
          }
        } catch (err) {
          console.error('Failed to fetch reports list', err);
        }
      };
      fetchLatest();
    }
  }, [id, setSearchParams]);

  return { id, report, loading };
};
