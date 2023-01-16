import { FormHookContext } from '../types';
import { useContextEmitter } from './useContextEmitter';

const useFormConnect = (): FormHookContext => {
	return useContextEmitter('*');
};

export default useFormConnect;
