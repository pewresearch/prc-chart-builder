/**
 * WordPress Dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

export const useCharts = () => {
	const [charts, setCharts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		apiFetch({ path: '/wp/v2/chart?per_page=100&context=edit' })
			.then((data) => {
				setCharts(data);
			})
			.catch((error) => {
				console.error('Error fetching charts:', error);
				setCharts([]);
			})
			.finally(() => setIsLoading(false));
	}, []);

	return { charts, isLoading };
};

export default useCharts;
