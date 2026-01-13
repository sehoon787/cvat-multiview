# Generated manually for multiview variable view count support

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('engine', '0098_labeledtrack_view_id'),
    ]

    operations = [
        # Add view_count field with default=5 for backward compatibility
        migrations.AddField(
            model_name='multiviewdata',
            name='view_count',
            field=models.PositiveSmallIntegerField(default=5),
        ),

        # Make existing view2-5 nullable
        migrations.AlterField(
            model_name='multiviewdata',
            name='video_view2',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='multiview_view2',
                to='engine.video'
            ),
        ),
        migrations.AlterField(
            model_name='multiviewdata',
            name='video_view3',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='multiview_view3',
                to='engine.video'
            ),
        ),
        migrations.AlterField(
            model_name='multiviewdata',
            name='video_view4',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='multiview_view4',
                to='engine.video'
            ),
        ),
        migrations.AlterField(
            model_name='multiviewdata',
            name='video_view5',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='multiview_view5',
                to='engine.video'
            ),
        ),

        # Add new view6-10 fields (all nullable)
        migrations.AddField(
            model_name='multiviewdata',
            name='video_view6',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='multiview_view6',
                to='engine.video'
            ),
        ),
        migrations.AddField(
            model_name='multiviewdata',
            name='video_view7',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='multiview_view7',
                to='engine.video'
            ),
        ),
        migrations.AddField(
            model_name='multiviewdata',
            name='video_view8',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='multiview_view8',
                to='engine.video'
            ),
        ),
        migrations.AddField(
            model_name='multiviewdata',
            name='video_view9',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='multiview_view9',
                to='engine.video'
            ),
        ),
        migrations.AddField(
            model_name='multiviewdata',
            name='video_view10',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='multiview_view10',
                to='engine.video'
            ),
        ),
    ]
