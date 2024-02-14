export interface HelixUser {
	broadcaster_type: '' | 'affiliate' | 'partner';
	created_at: string;
	description: string;
	display_name: string;
	email?: string;
	id: string;
	login: string;
	offline_image_url: string;
	profile_image_url: string;
	type: '' | 'admin' | 'global_mod' | 'staff';
}
