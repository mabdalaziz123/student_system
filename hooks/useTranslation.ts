// Simple translation wrapper for quick integration
import { useLanguage } from '../contexts/LanguageContext';

export const useTranslation = () => {
    const { t, dir, language } = useLanguage();

    // Helper function to translate status
    const translateStatus = (status: string) => {
        const statusMap: Record<string, any> = {
            'PENDING': t.pending,
            'Pending': t.pending,
            'APPROVED': t.approved,
            'Approved': t.approved,
            'Accepted': t.approved,
            'REJECTED': t.rejected,
            'Rejected': t.rejected,
            'Missing Documents': t.pending, // fallback
        };
        return statusMap[status] || status;
    };

    // Helper function to translate degree
    const translateDegree = (degree: string) => {
        const degreeMap: Record<string, any> = {
            'Bachelor': t.bachelor,
            'بكالوريوس': t.bachelor,
            'Master': t.master,
            'ماجستير': t.master,
            'PhD': t.phd,
            'دكتوراه': t.phd,
        };
        return degreeMap[degree] || degree;
    };

    // Helper function to translate gender
    const translateGender = (gender: string) => {
        const genderMap: Record<string, any> = {
            'Male': t.male,
            'ذكر': t.male,
            'Female': t.female,
            'أنثى': t.female,
        };
        return genderMap[gender] || gender;
    };

    // Helper function to translate role
    const translateRole = (role: string) => {
        const roleMap: Record<string, any> = {
            'ADMIN': t.admin,
            'Admin': t.admin,
            'AGENT': t.agent,
            'Agent': t.agent,
            'USER': t.user,
            'User': t.user,
        };
        return roleMap[role] || role;
    };

    return {
        t,
        dir,
        language,
        translateStatus,
        translateDegree,
        translateGender,
        translateRole,
    };
};
