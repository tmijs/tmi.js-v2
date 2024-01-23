export interface HelixUser {
	id: string;
	login: string;
	display_name: string;
	type: 'admin' | 'global_mod' | 'staff' | '';
	broadcaster_type: 'partner' | 'affiliate' | '';
	description: string;
	profile_image_url: string;
	offline_image_url: string;
	email?: string;
	created_at: string;
}