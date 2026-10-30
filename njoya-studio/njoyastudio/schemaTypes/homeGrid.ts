
export default {
    name: 'homeGrid',
    title: 'Home Grid Paintings',
    type: 'document',
    fields: [
        {
            name: 'homeGridImage1',
            type: 'image',
            title: 'Home Grid Image #1',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'homeGridImage2',
            type: 'image',
            title: 'Home Grid Image #2',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        },
        {
            name: 'homeGridImage3',
            type: 'image',
            title: 'Home Grid Image #3',
            option: {
                hotspot: true
            },
            fields: [
                {
                  type: 'text',
                  name: 'alt',
                  title: 'Alternative Text',
                },
            ]
        }
    ]
  }
  