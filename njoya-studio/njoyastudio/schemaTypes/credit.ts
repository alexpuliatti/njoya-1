/**
 * Shared credit object used by both `subShoots` and `designProjects`.
 *
 * The preset role list below is intentionally shared between both document
 * types. When adding a role here, also add a matching entry to ROLE_LABELS in
 * lib/credits.ts so the front end renders a readable label instead of the raw
 * value.
 */
export default {
  name: 'credit',
  title: 'Credit',
  type: 'object',
  fields: [
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          {title: 'Photographer', value: 'photographer'},
          {title: 'Talent', value: 'talent'},
          {title: 'Model', value: 'model'},
          {title: 'Set Designer', value: 'setDesigner'},
          {title: 'Stylist', value: 'stylist'},
          {title: 'Assistant', value: 'assistant'},
          {title: 'Makeup Artist', value: 'makeupArtist'},
          {title: 'Hair Stylist', value: 'hairStylist'},
          {title: 'Creative Director', value: 'creativeDirector'},
          {title: 'Producer', value: 'producer'},
          {title: 'Cast Director', value: 'castDirector'},
          {title: 'Manicurist', value: 'manicurist'},
          {title: 'Designer', value: 'designer'},
          {title: 'Njoya Studios Team', value: 'njoyaTeam'},
          {title: '3D Render Design', value: 'renderDesign'},
          {title: 'Construction Team', value: 'constructionTeam'},
          {title: 'Project Type', value: 'type'},
          {title: 'Location', value: 'location'},
          {title: 'Other (specify)', value: 'other'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'customRole',
      title: 'Custom Role Name',
      type: 'string',
      description: 'Only used when Role is set to "Other".',
      hidden: ({parent}: any) => parent?.role !== 'other',
      validation: (Rule: any) =>
        Rule.custom((value: string | undefined, ctx: any) =>
          ctx.parent?.role === 'other' && !value ? 'Required when Role is "Other"' : true,
        ),
    },
    {
      name: 'name',
      title: 'Name / Value',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
  ],
  preview: {
    select: {role: 'role', customRole: 'customRole', name: 'name'},
    prepare: ({role, customRole, name}: any) => ({
      title: name || '(no name)',
      subtitle: role === 'other' ? customRole || 'Other' : role,
    }),
  },
}
