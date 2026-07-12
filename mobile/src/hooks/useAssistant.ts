import { useMutation } from '@tanstack/react-query';
import { assistantApi } from '../services/api';
import { SymptomCheckRequest, SymptomCheckResult } from '../types';

// Single-turn symptom assessment. Not cached — each submission is a fresh call.
export const useSymptomCheck = () =>
  useMutation<SymptomCheckResult, unknown, SymptomCheckRequest>({
    mutationFn: async (input) => {
      const { data } = await assistantApi.symptomCheck(input);
      return data.data;
    },
  });
